# Repository rules

## Git

- Pushing to `origin` (`cataclysmbn/changelog`) is authorized without asking, on `main` and on `images`. `deno task html` must push post images to `images`, and finished work goes to `main`.
- Force-push with `--force-with-lease` pinned to the expected remote SHA is authorized on both branches.
