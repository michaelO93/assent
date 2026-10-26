export const consentRegistryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "attestor_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyRevoked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BadSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GuardianNotVerified",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAttestor",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RequestAlreadyUsed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "str",
        "type": "string"
      }
    ],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnknownConsent",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "attestor",
        "type": "address"
      }
    ],
    "name": "AttestorChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "appId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "subject",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "receiptHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum ConsentRegistry.AgeBand",
        "name": "ageBand",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "expiresAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "scopes",
        "type": "string"
      }
    ],
    "name": "ConsentGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "appId",
        "type": "bytes32"
      }
    ],
    "name": "ConsentRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      }
    ],
    "name": "GuardianUnverified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      }
    ],
    "name": "GuardianVerified",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "attestor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "consentByRequest",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      }
    ],
    "name": "consentsOf",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      }
    ],
    "name": "getConsent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "guardian",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "appId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "subject",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "receiptHash",
            "type": "bytes32"
          },
          {
            "internalType": "enum ConsentRegistry.AgeBand",
            "name": "ageBand",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "grantedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiresAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "revokedAt",
            "type": "uint64"
          },
          {
            "internalType": "string",
            "name": "scopes",
            "type": "string"
          }
        ],
        "internalType": "struct ConsentRegistry.Consent",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "guardian",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "appId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "subject",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "receiptHash",
            "type": "bytes32"
          },
          {
            "internalType": "enum ConsentRegistry.AgeBand",
            "name": "ageBand",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "expiresAt",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "requestId",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "scopes",
            "type": "string"
          }
        ],
        "internalType": "struct ConsentRegistry.GrantInput",
        "name": "g",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "grant",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "guardianVerifiedAt",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "appId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "subject",
        "type": "bytes32"
      }
    ],
    "name": "isValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "consentId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "revoke",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "attestor_",
        "type": "address"
      }
    ],
    "name": "setAttestor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      }
    ],
    "name": "unverifyGuardian",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "guardian",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      }
    ],
    "name": "verifyGuardian",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
