# Frontend Masters video downloader

[![License][licence-badge]](#license)
[![Min NodeJs][node-badge]][node]
[![Dependencies][dependencies-badge]][dependencies-list]
[![buddy pipeline][buddy-badge]][buddy-pipeline]
[![Codacy Badge][codacy-badge]][codacy-url]
[![Patreon][patreon-badge]][patreon-url]

Based on Nodejs and Puppeteer, you can launch it from the command line providing your credentials and it will download the course of your choice.

💓 New feature: **auto-completion** of course titles!

💓 New feature: **subtitles downloads**

## Installation

Create a directory on your disk:

```
mkdir -p fmdl
cd fmdl
```

From inside the directory type:

```
npm install frontend-masters-course-downloader
```

Note that Puppeteer installation will download a version of Chromium compatible with your os.

## Usage

Run the following command:

```
npx fem-downloader
```

Then, you'll be prompted with a few questions, i.e. :

```
? Please insert your username: ....
? Please insert your password: ....
? Please insert course slug: ....
? Download bandwidth limit: ....
? Launch Puppeteer in headless mode? (Y/n):
? Are the information correct? (Y/n):
```

Once the download starts you'll be shown a progress bar for the current lesson:

```
14:13:31: Downloading 8-removing-bad-links subtitles.

11:23:53: Downloading video: 8-removing-bad-links
 █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 21% | ETA: 56s | 876370/4080650
```

1.  If not in headless mode, Puppeteer will open a browser window and will log in to Frontend Masters using the provided credentials.
2.  After logging in, it will go to the main page of the course you selected and begin downloading its lessons one by one.
3.  The course will be downloaded into the project root, in its own folder, and each lesson will have its slug name.
4.  Each lesson group will have its separate folder and each lesson will be prepended with a number reflecting its order.

## ⚠ Warning

I strongly encourage you to **limit the download bandwidth** at 100Kb/250Kb to reduce the risk of your account being suspended. See issue [#3](https://github.com/cristian-gabbanini/fem-downloader/issues/3).

In addition I do not encourage you to download **more than 1 course at a time** (the disclaimer below is clear about what the purpose of this tool is, so read it carefully and, if you have any doubts, I suggest you to read the FrontendMasters TOS).

## Disclaimer

This is not intended as a means of software piracy.

You are not allowed to redistribute or publish any course you will download with this tool and therefore I **strongly discourage**
this kind of usage.

The sole purpose of this piece of software is to provide a way to Frontend Masters subscribers to download the courses they like more for **exclusive personal use**.

## 🌟 Star the repo

If you like this software or you think it's useful you are welcome to like it on [Github](https://github.com/cristian-gabbanini/fem-downloader)

## 🤗 Help me continuing adding new features

Support me on Patreon!
https://www.patreon.com/join/cristiangabbanini/

## License

```bash
Copyright (c) Cristian Gabbanini - https://github.com/cristian-gabbanini

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

[licence-badge]: https://img.shields.io/badge/licence-MIT-yellowgreen.svg
[node-badge]: https://img.shields.io/badge/node-%3E%3D%208.0.0-brightgreen.svg
[node]: https://nodejs.org/en/
[dependencies-badge]: https://david-dm.org/cristian-gabbanini/fem-downloader.svg
[dependencies-list]: https://david-dm.org/cristian-gabbanini/fem-downloader
[buddy-badge]: https://app.buddy.works/cristiangabbanini/fem-downloader/pipelines/pipeline/187504/badge.svg?token=6e28f37dda78c47b32e6142a0d1431bc15100963789a2ae7ceb97f02e61f7ee6
[buddy-pipeline]: https://app.buddy.works/cristiangabbanini/fem-downloader/pipelines/pipeline/187504
[codacy-badge]: https://api.codacy.com/project/badge/Grade/e52f1ff64e934b7d9896fe8edbf3bdfc
[codacy-url]: https://www.codacy.com/app/cristian-gabbanini/fem-downloader?utm_source=github.com&utm_medium=referral&utm_content=cristian-gabbanini/fem-downloader&utm_campaign=Badge_Grade
[patreon-badge]: https://img.shields.io/badge/patreon-donate-green.svg
[patreon-url]: https://www.patreon.com/join/cristiangabbanini/
