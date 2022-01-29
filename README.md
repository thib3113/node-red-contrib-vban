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

First, be sure to have a ready node-red environnement (follow install tutorial), then clone the repos and install it in node-red config directory with a local module `npm i /home/thib3113/repo/` .

Then, you can create a new node, you can check the example of `VBANReceiver` :
* Run the command : `gulp createNode --n=my-node-name` (replace `my-node-name` by your node name, using kebab-case)
* A file `MyNodeName.ts` will be created in `src/nodes` (`MyNodeName``is the PascalCase version of ``my-node-name)
    * check it parents to check the functions available for your node
    * type of the node will be in `src/types/TMyNodeNameNode.ts` (part that will be exported to other nodes)
    * typed config/definition for the node will be in `src/types/TMyNodeNameNodeConfig.ts`
* A file `MyNodeName.html` will be created in `src/nodes`, it's the configuration UI part of your node, where you can set the option you need (doesn't forget to add them to `src/types/TMyNodeNameNodeConfig.ts` too)

This library use the nodejs library VBAN, feel free to read the documentation [here](https://thib3113.github.io/vban/) .

When you are ready, open a PR

Thank you

## Donations
more informations [here](https://github.com/thib3113/vban#donations)
