# Единая среда golden-тестов: и на Маке, и в CI кадры рендерятся здесь (linux/amd64), поэтому эталоны совпадают
# пиксель в пиксель — растеризация текста в Chrome на macOS и Linux разная, сравнивать их напрямую нельзя.
FROM node:22.22.1-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
      libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
      libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 rsync \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
ENV PNPM_HOME=/pnpm-store CI=1
WORKDIR /work
COPY run.sh /usr/local/bin/golden-run
RUN chmod +x /usr/local/bin/golden-run
ENTRYPOINT ["golden-run"]
