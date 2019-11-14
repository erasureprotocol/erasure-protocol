# Deployment Instructions
Create a .pypirc file in your home directory like so:
```
▶ cat ~/.pypirc
[distutils]
index-servers =
    pypi

[pypi]
repository: https://upload.pypi.org/legacy/
username: REPLACE_ME
password: ***
```

Install twine:
```
pip3 install twine
```

Build the dist packages:
```
rm -rf dist
python3 setup.py sdist bdist_wheel
```

Deploy:
```
twine upload dist/*
```