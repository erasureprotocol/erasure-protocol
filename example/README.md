# Erasure Example

## Prerequisites
Node version `>=11`

## Overview
This guide aims to serve as a guidance on how to use the philosophy of Erasure in your favor. 
The example allows you to have a better understanding on the flow of a simple erasure interaction between two people - buyer and seller. In this flow the seller submits an encrypted prediction on the blockchain and sells it ot the buyer. All is achieved using Erasure, cryptography and IPFS as distributed storage.

In the process of creation we followed the documentation of [Example Usage of ErasureClient](https://github.com/erasureprotocol/erasure-protocol#example-usage-of-erasureclient)
All main functionalities deliberately are in the `main` function. You could follow there te flow as per the example stated above.
Main points include:
- registering a user
- generating proofHash
- submitting a post
- creating escrow
- encrypting/decrypting the information
- validating the information.

We deliberately chose to keep it all in a single file, so that you can easily look up the implementation of any functionality you might be interested.

## Install

In order to run the simple tutorial, you would need to complete the following steps:

- you would need to [instantiate a ganache instance with NMR and erasure protocol](../packages/testenv/README.md)
- `yarn`
- `node app.js`
