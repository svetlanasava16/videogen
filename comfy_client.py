#!/usr/bin/env python3
"""Очередь шотов для локального ComfyUI.

Только стандартная библиотека (работает на системном python3 3.9+).

Использование:
    python3 comfy_client.py check   [shots.json]      # сервер, workflow, наличие моделей
    python3 comfy_client.py run     shots.json        # сгенерировать все шоты
    python3 comfy_client.py run     shots.json --only shot02 --force
    python3 comfy_client.py run     shots.json --dry-run   # показать патч, ничего не отправлять
    python3 comfy_client.py nodes   [workflow_api.json]    # таблица нод и их входов

Формат shots.json — см. CLAUDE.md.
"""
import argparse
import copy
import json
import mimetypes
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

DEFAULT_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8188")
CLIENT_ID = str(uuid.uuid4())
MODEL_EXT = (".safetensors", ".gguf", ".ckpt", ".pt", ".pth", ".bin", ".sft")


# ---------------------------------------------------------------- HTTP ------
class ComfyError(Exception):
    pass


def http(url, data=None, headers=None, timeout=30):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        raise ComfyError("HTTP %s %s\n%s" % (e.code, url, body))
    except urllib.error.URLError as e:
        raise ComfyError("Нет связи с %s: %s (ComfyUI запущен?)" % (url, e.reason))


def get_json(base, path, timeout=30):
    return json.loads(http(base + path, timeout=timeout))


def post_json(base, path, payload):
    data = json.dumps(payload).encode()
    return json.loads(http(base + path, data, {"Content-Type": "application/json"}))


def upload_file(base, local_path, overwrite=True):
    """Загружает картинку/видео/аудио во input ComfyUI, возвращает имя для LoadImage и т.п."""
    boundary = uuid.uuid4().hex
    name = os.path.basename(local_path)
    ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
    with open(local_path, "rb") as f:
        content = f.read()
    parts = []
    for k, v in (("overwrite", "true" if overwrite else "false"), ("type", "input")):
        parts.append(('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n'
                      % (boundary, k, v)).encode())
    parts.append(('--%s\r\nContent-Disposition: form-data; name="image"; filename="%s"\r\n'
                  "Content-Type: %s\r\n\r\n" % (boundary, name, ctype)).encode())
    parts.append(content + b"\r\n")
    parts.append(("--%s--\r\n" % boundary).encode())
    res = json.loads(http(base + "/upload/image", b"".join(parts),
                          {"Content-Type": "multipart/form-data; boundary=" + boundary},
                          timeout=300))
    return (res.get("subfolder") + "/" if res.get("subfolder") else "") + res["name"]


# ------------------------------------------------------------ workflow ------
def load_workflow(path):
    if not os.path.exists(path):
        sys.exit("Нет файла %s — экспортируйте workflow из ComfyUI (Export (API))." % path)
    with open(path) as f:
        wf = json.load(f)
    if "nodes" in wf and "links" in wf:
        sys.exit("%s — это UI-формат. В ComfyUI: Workflow → Export (API) / Save (API Format)." % path)
    if not all(isinstance(v, dict) and "class_type" in v for v in wf.values()):
        sys.exit("%s не похож на API-формат ComfyUI." % path)
    return wf


def resolve_target(wf, target):
    """'12.text' или '12.inputs.text' -> (node_id, input_name)."""
    parts = target.split(".")
    if len(parts) == 3 and parts[1] == "inputs":
        parts = [parts[0], parts[2]]
    if len(parts) != 2:
        raise ValueError("Цель '%s': ожидается 'node_id.input'" % target)
    node_id, field = parts
    if node_id not in wf:
        raise ValueError("Нода %s не найдена в workflow (цель '%s')" % (node_id, target))
    return node_id, field


def apply_values(wf, params, values):
    """values: {alias или 'node.input': значение}. params: {alias: цель или [цели]}."""
    for key, val in values.items():
        targets = params.get(key, key)
        if isinstance(targets, str):
            targets = [targets]
        for t in targets:
            nid, field = resolve_target(wf, t)
            wf[nid]["inputs"][field] = val


def seed_targets(wf, params):
    """Куда писать seed: alias 'seed' из params, иначе все входы seed/noise_seed."""
    if "seed" in params:
        t = params["seed"]
        return [t] if isinstance(t, str) else list(t)
    out = []
    for nid, node in wf.items():
        for k, v in node.get("inputs", {}).items():
            if k in ("seed", "noise_seed") and not isinstance(v, list):
                out.append("%s.%s" % (nid, k))
    return out


# --------------------------------------------------------------- run --------
def wait_for(base, prompt_id, timeout, poll=2.0):
    start = time.time()
    last_note = 0
    while True:
        hist = get_json(base, "/history/" + prompt_id)
        if prompt_id in hist:
            return hist[prompt_id]
        el = time.time() - start
        if el > timeout:
            raise TimeoutError("Шот не завершился за %d с" % timeout)
        if el - last_note >= 30:
            q = get_json(base, "/queue")
            running = any(item[1] == prompt_id for item in q.get("queue_running", []))
            print("    … %ds, %s" % (el, "выполняется" if running else "в очереди"), flush=True)
            last_note = el
        time.sleep(poll)


def extract_error(entry):
    status = entry.get("status", {})
    for msg in status.get("messages", []):
        if msg and msg[0] == "execution_error":
            d = msg[1]
            return "%s (нода %s %s): %s" % (d.get("exception_type"), d.get("node_id"),
                                             d.get("node_type"), d.get("exception_message", "").strip())
    if status.get("status_str") == "error":
        return "execution error"
    return None


def download_outputs(base, entry, dest_dir, prefix):
    os.makedirs(dest_dir, exist_ok=True)
    saved = []
    for node_id, out in entry.get("outputs", {}).items():
        for kind, items in out.items():
            if not isinstance(items, list):
                continue
            for it in items:
                if not isinstance(it, dict) or "filename" not in it:
                    continue
                if it.get("type") == "temp":  # превью, не результат
                    continue
                q = urllib.parse.urlencode({"filename": it["filename"],
                                            "subfolder": it.get("subfolder", ""),
                                            "type": it.get("type", "output")})
                data = http(base + "/view?" + q, timeout=600)
                local = os.path.join(dest_dir, "%s_%s" % (prefix, it["filename"]))
                with open(local, "wb") as f:
                    f.write(data)
                saved.append(local)
    return saved


def load_report(path):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"shots": {}}


def save_report(path, report):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def cmd_run(args):
    base = args.url.rstrip("/")
    with open(args.shots) as f:
        spec = json.load(f)
    root = os.path.dirname(os.path.abspath(args.shots))
    wf_path = os.path.join(root, spec.get("workflow", "workflow_api.json"))
    base_wf = load_workflow(wf_path)
    params = spec.get("params", {})
    defaults = spec.get("defaults", {})
    out_dir = os.path.join(root, spec.get("out_dir", "out"))
    retries = int(spec.get("retries", 2))
    timeout = int(spec.get("timeout_sec", 3600))
    os.makedirs(out_dir, exist_ok=True)
    report_path = os.path.join(out_dir, "report.json")
    report = load_report(report_path)

    shots = spec["shots"]
    if args.only:
        wanted = set(args.only.split(","))
        shots = [s for s in shots if s["id"] in wanted]
        if not shots:
            sys.exit("Нет шотов с id %s" % args.only)

    if not args.dry_run:
        get_json(base, "/system_stats", timeout=5)  # быстрая проверка связи

    for shot in shots:
        sid = shot["id"]
        prev = report["shots"].get(sid)
        if prev and prev.get("status") == "ok" and not args.force:
            print("[%s] уже готов, пропуск (--force чтобы перегенерировать)" % sid)
            continue

        values = dict(defaults)
        values.update(shot.get("values", {}))
        uploads = shot.get("uploads", {})  # {alias: локальный путь}

        wf = copy.deepcopy(base_wf)
        try:
            for alias, local in uploads.items():
                lp = os.path.join(root, local)
                if args.dry_run:
                    values[alias] = os.path.basename(lp)
                else:
                    print("[%s] загрузка %s" % (sid, local))
                    values[alias] = upload_file(base, lp)
            seed_given = "seed" in values
            seed = int(values.pop("seed")) if seed_given else random.randint(0, 2**31 - 1)
            apply_values(wf, params, values)
        except (ValueError, OSError, ComfyError) as e:
            report["shots"][sid] = {"status": "failed", "error": str(e), "attempts": 0}
            save_report(report_path, report)
            print("[%s] ОШИБКА подготовки: %s" % (sid, e))
            continue

        s_targets = seed_targets(wf, params)
        attempts = []
        result = {"status": "failed"}
        for attempt in range(retries + 1):
            if attempt > 0:
                seed = random.randint(0, 2**31 - 1)
            for t in s_targets:
                nid, field = resolve_target(wf, t)
                wf[nid]["inputs"][field] = seed

            if args.dry_run:
                print("[%s] dry-run, seed=%d" % (sid, seed))
                print(json.dumps({k: wf[k] for k in wf if wf[k] != base_wf.get(k)},
                                 ensure_ascii=False, indent=2))
                result = {"status": "dry-run"}
                break

            t0 = time.time()
            print("[%s] попытка %d/%d, seed=%d" % (sid, attempt + 1, retries + 1, seed), flush=True)
            try:
                resp = post_json(base, "/prompt", {"prompt": wf, "client_id": CLIENT_ID})
            except ComfyError as e:
                # Ошибка валидации (не та модель, неверный вход) — повтор с другим seed не поможет.
                attempts.append({"seed": seed, "error": str(e)})
                print("    отклонено сервером:\n" + str(e))
                break
            pid = resp["prompt_id"]
            try:
                entry = wait_for(base, pid, timeout)
            except (TimeoutError, ComfyError) as e:
                attempts.append({"seed": seed, "prompt_id": pid, "error": str(e)})
                print("    " + str(e))
                if isinstance(e, TimeoutError):
                    try:
                        post_json(base, "/interrupt", {"prompt_id": pid})
                    except ComfyError:
                        pass
                continue
            err = extract_error(entry)
            dur = round(time.time() - t0, 1)
            if err:
                attempts.append({"seed": seed, "prompt_id": pid, "error": err, "sec": dur})
                print("    ошибка: " + err)
                continue
            files = download_outputs(base, entry, os.path.join(out_dir, sid), sid)
            if not files:
                attempts.append({"seed": seed, "prompt_id": pid, "error": "нет выходных файлов", "sec": dur})
                print("    нет выходных файлов (есть ли в workflow Save-нода?)")
                continue
            attempts.append({"seed": seed, "prompt_id": pid, "sec": dur})
            result = {"status": "ok", "seed": seed, "files": [os.path.relpath(p, root) for p in files],
                      "sec": dur}
            print("    готово за %.0fs: %s" % (dur, ", ".join(result["files"])))
            break

        if args.dry_run:
            continue
        result["attempts"] = attempts
        result["values"] = {k: v for k, v in values.items()}
        result["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        report["shots"][sid] = result
        save_report(report_path, report)

    if not args.dry_run:
        ok = sum(1 for s in shots if report["shots"].get(s["id"], {}).get("status") == "ok")
        print("\nИтого: %d/%d ok. Отчёт: %s" % (ok, len(shots), os.path.relpath(report_path)))
        if ok < len(shots):
            sys.exit(1)


# ------------------------------------------------------------- check --------
def available_models(base):
    out = {}
    try:
        folders = get_json(base, "/models")
    except ComfyError:
        folders = ["checkpoints", "diffusion_models", "unet", "vae", "text_encoders", "clip", "loras"]
    for fld in folders:
        if fld in ("configs", "custom_nodes"):
            continue
        try:
            out[fld] = set(get_json(base, "/models/" + fld))
        except ComfyError:
            pass
    return out


def cmd_check(args):
    base = args.url.rstrip("/")
    stats = get_json(base, "/system_stats", timeout=5)
    dev = stats["devices"][0] if stats.get("devices") else {}
    print("ComfyUI %s на %s, устройство %s, свободно %.1f/%.1f ГБ"
          % (stats["system"].get("comfyui_version"), base, dev.get("type"),
             dev.get("vram_free", 0) / 2**30, dev.get("vram_total", 0) / 2**30))
    models = available_models(base)
    for fld in sorted(models):
        if models[fld]:
            print("  %-18s %s" % (fld, ", ".join(sorted(models[fld]))))
    all_names = set().union(*models.values()) if models else set()

    wf_path = args.target or "workflow_api.json"
    if wf_path.endswith(".json") and os.path.exists(wf_path):
        with open(wf_path) as f:
            data = json.load(f)
        if "shots" in data:  # передали shots.json
            wf_path = os.path.join(os.path.dirname(os.path.abspath(wf_path)),
                                   data.get("workflow", "workflow_api.json"))
    if not os.path.exists(wf_path):
        print("\nworkflow %s пока нет — экспортируйте из ComfyUI (Save API Format)." % wf_path)
        return
    wf = load_workflow(wf_path)
    missing = []
    for nid, node in wf.items():
        for k, v in node.get("inputs", {}).items():
            if isinstance(v, str) and v.lower().endswith(MODEL_EXT) and v not in all_names:
                missing.append("нода %s %s.%s = %s" % (nid, node["class_type"], k, v))
    info = get_json(base, "/object_info")
    unknown = sorted({n["class_type"] for n in wf.values() if n["class_type"] not in info})
    print("\nworkflow: %s, нод: %d" % (wf_path, len(wf)))
    if unknown:
        print("  НЕИЗВЕСТНЫЕ ноды (нужны custom nodes): " + ", ".join(unknown))
    if missing:
        print("  НЕТ моделей (ещё качаются или не в той папке):")
        for m in missing:
            print("    - " + m)
    if not unknown and not missing:
        print("  всё на месте, можно запускать")
    else:
        sys.exit(1)


def cmd_nodes(args):
    wf = load_workflow(args.target or "workflow_api.json")
    for nid in sorted(wf, key=lambda x: (len(x), x)):
        node = wf[nid]
        title = node.get("_meta", {}).get("title", "")
        print("%s  %s%s" % (nid, node["class_type"], "  «%s»" % title if title else ""))
        for k, v in node.get("inputs", {}).items():
            if isinstance(v, list):
                continue  # связь с другой нодой
            s = json.dumps(v, ensure_ascii=False)
            print("    .%s = %s" % (k, s if len(s) < 90 else s[:87] + "..."))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default=DEFAULT_URL)
    sub = ap.add_subparsers(dest="cmd")
    r = sub.add_parser("run")
    r.add_argument("shots")
    r.add_argument("--only", help="id шотов через запятую")
    r.add_argument("--force", action="store_true", help="перегенерировать уже готовые")
    r.add_argument("--dry-run", action="store_true")
    for name in ("check", "nodes"):
        p = sub.add_parser(name)
        p.add_argument("target", nargs="?")
    # совместимость: python3 comfy_client.py shots.json  ==  run shots.json
    argv = sys.argv[1:]
    if argv and argv[0].endswith(".json"):
        argv = ["run"] + argv
    args = ap.parse_args(argv)
    try:
        if args.cmd == "run":
            cmd_run(args)
        elif args.cmd == "check":
            cmd_check(args)
        elif args.cmd == "nodes":
            cmd_nodes(args)
        else:
            ap.print_help()
    except ComfyError as e:
        sys.exit(str(e))
    except KeyboardInterrupt:
        sys.exit("\nПрервано. Уже готовые шоты сохранены в report.json.")


if __name__ == "__main__":
    main()
