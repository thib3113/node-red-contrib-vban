#Examples

Here you can get some examples :

* [Receive AUDIO](Receive%20AUDIO.json) : example of how to receive and filter to get only audio packet .
* [Receive SERIAL or MIDI](Receive%20SERIAL%20or%20MIDI.json) : example of how to receive and filter to get only SERIAL, or a MIDI packet .
* [Receive SERVICE](Receive%20SERVICE.json) : example of how to receive and filter to get only SERVICE packet . By default, you don't need to manually answer to them
* [Receive TEXT](Receive%20TEXT.json) : example of how to receive and filter to get only TEXT packet .
* [Send TEXT](Send%20TEXT.json) : example how to send TEXT .

## Text
The text protocol, can be used to control Voicemeeter macro (like other VBAN apps), you can read the user manual : [HERE](https://vb-audio.com/Voicemeeter/Voicemeeter_UserManual.pdf) (macro buttons part, near line 40)

Example, to load and start a sound in the Recorder :
```
recorder.load="C:\\soundboard\text.wav";
recorder.Play=1;
```

So converted in json (`"` need to be escaped, like `\ `) :
```
{
    "packet": {
        "subProtocol": "TXT",
        "text": "recorder.load=\"C:\\\\soundboard\\text.wav\";recorder.Play=1;"
    }
}
```
