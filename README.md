# node-red-contrib-vban

## Examples

Some examples are available directly in node-red : `Menu => Import => Examples => node-red-contrib-vlan`

And you can get more informations in the [Examples folder](https://github.com/thib3113/node-red-contrib-vban/tree/main/examples)

---

## Security
A point about security.

VBAN can allow you to run programs on the other computer, so without security, it can allow an attacker to take the control of your computer .

Doesn't forget to allow only some senders, and doesn't accept packet from all ips .

## Developpers / Contributing
Adding nodes to this library is pretty easy .

First of all, be sure to have a ready node-red environnement (follow install tutorial), then clone the repos and install it in node-red config directory with a local module `npm i /home/thib3113/repo/` .

Then, you can create a new node, you can check the example of `VBANReceiver` :
```
- create a ts file in src/nodes
  - create a classe extending Node
  - export a function that will call the function "registerNode"
- create an html file with the same name as the ts file (without the extension)
- configure the package.json node-red part to add your node
```

This library use the nodejs library VBAN, feel free to read the documentation [here](https://thib3113.github.io/vban/) .

When you are ready, open a PR

Thank you

## Donations
more informations [here](https://github.com/thib3113/vban#donations)
