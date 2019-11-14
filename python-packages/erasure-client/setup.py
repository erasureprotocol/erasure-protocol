from setuptools import setup

# read the contents of the README file
from os import path
this_directory = path.abspath(path.dirname(__file__))
with open(path.join(this_directory, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(name='erasure-client',
      version='0.1.0',
      description='A client for interacting with the erasure protocol.',
      url='https://github.com/erasureprotocol/erasure-protocol/tree/master/python-packages/erasure-client',
      author='Numerai',
      author_email='contact@numer.ai',
      license='MIT',
      packages=['erasure_lib'],
      include_package_data=True,
      long_description=long_description,
      long_description_content_type='text/markdown',
      install_requires=[]
      )