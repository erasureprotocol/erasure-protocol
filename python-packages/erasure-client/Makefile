SHELL:=/bin/bash

all: test

setup:
	test -e venv || python3 -m venv venv

install-deps: setup
	source ./venv/bin/activate && pip install -r requirements.txt

install: setup
	source ./venv/bin/activate && pip install -e .

install-dev: install
	source ./venv/bin/activate && pip install pylint flake8

test:
	source ./venv/bin/activate && python -m unittest discover tests/

style:
	source ./venv/bin/activate && flake8 --config=./.flake8 erasure_lib tests

lint:
	source ./venv/bin/activate && pylint erasure_lib

clean:
	rm -rf *.egg-info */__pycache__
