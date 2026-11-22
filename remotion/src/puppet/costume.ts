/**
 * Костюм куклы в эпизоде: роль → вариант костюма (content/characters → bible.variants), поверх — патч эпизода (looks).
 * Если кукла играет роль, у которой своего костюма нет (двойник-пилот, парень-врач), форма берётся у куклы —
 * хозяйки роли: её одежда и головной убор по этой роли (пилотская форма, халат врача, полицейская фуражка).
 */
import { applyLook, lookForRole, type Character, type Look, type LookPatch } from "@jf/core";
import { characters } from "../registry";
import { HAT_IDS, WEAR_IDS } from "./wardrobe";

/** Головные уборы (слот hat в content/wardrobe): при чужой форме свой убор снимается (одна шапка на голове). */
const HATS = HAT_IDS();
/** Что считается формой (переносится от хозяйки роли): вещи гардероба с wear: true — комплекты, галстуки, фартук, стетоскоп, рясы, головные уборы. */
const WEAR = WEAR_IDS();

export function costumeFor(ch: Character, role?: string, episode?: LookPatch): Look {
  const own = !role || ch.bible?.roles.includes(role) || ch.bible?.variants.some((v) => v.roles.includes(role));
  if (own) return lookForRole(ch, role, episode);
  const owner = Object.values(characters).find((c) => c.bible?.roles.includes(role) || c.bible?.variants.some((v) => v.roles.includes(role)));
  if (!owner) return lookForRole(ch, role, episode);
  const wear = lookForRole(owner, role).accessories.filter((a) => WEAR.has(a));
  if (!wear.length) return lookForRole(ch, role, episode);
  const base = lookForRole(ch);
  const dropHats = wear.some((a) => HATS.includes(a)) ? base.accessories.filter((a) => HATS.includes(a)) : [];
  return applyLook(applyLook(base, { add: wear, remove: dropHats }), episode);
}
