# node-red-contrib-vban

This node is here to interact with VBAN .

VBAN is a protocol used by VB-Audio software products ( Voicemeeter / VB-Cables / MT-128 and other )

So, you can :
 * control your node-red from a MIDI keyboard (vban-receive-midi-or-serial)
 * update a midi keyboard from your node-red (vban-send-midi-or-serial)
 * Use macro from voicemeeter in node-red ? (vban-receive-text)
 * Or send a macro to voicemeeter (to play a sound on your computer for example) ? (vban-send-text)
 * and many others functions

Feel free to open an issue if you have a question

## Examples

Some examples are available directly in node-red : `Menu => Import => Examples => node-red-contrib-vlan`

And you can get more information in the [Examples folder](https://github.com/thib3113/node-red-contrib-vban/tree/main/examples)

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
