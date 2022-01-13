# node-red-contrib-vban

// TODO update readme

---

## Developpers / Contributing
Adding nodes to this library is pretty easy .

First of all, be sure to have a ready node-red environnement (follow install tutorial), then clone the repos and install it in node-red config directory with a local module `npm i /home/thib3113/repo/` .

Then, you can create a new node, you can check the example of `DoorEvents` :
```
- create a ts file in src/nodes
  - create a classe extending Node
  - export a function that will call the function "registerNode"
- create an html file with the same name as the ts file (without the extension)
- configure the package.json node-red part to add your node
```

To do request to Unifi, feel free to read the documentation of [unifi-client](https://thib3113.github.io/unifi-client/) .

When you are ready, open a PR

Thank you

## Donations
more informations [here](https://github.com/thib3113/vban#donations)
