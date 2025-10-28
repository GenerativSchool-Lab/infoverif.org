.PHONY: dev build embed purge clean test

dev:
	docker-compose up --build

build:
	cd api && docker build -t infoverif-api .
	cd web && npm run build

embed:
	python scripts/precompute_embeddings.py

purge:
	python scripts/purge_old_assets.py

clean:
	docker-compose down -v
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete

test:
	cd api && python -m pytest tests/

.DEFAULT_GOAL := dev

