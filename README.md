<p align="center">
    <a href="https://github.com/longsightedfilms/meshhouse/"><img src="https://raw.githubusercontent.com/longsightedfilms/meshhouse/dev/public/assets/integrations/meshhouse.svg?sanitize=true" width="400" /></a>
</p>
<p align="center">
    <a href="https://github.com/longsightedfilms/meshhouse/releases"><img alt="GitHub release (latest SemVer including pre-releases)" src="https://img.shields.io/github/v/release/longsightedfilms/meshhouse?include_prereleases&style=for-the-badge"></a>
    <a href="https://github.com/longsightedfilms/meshhouse/releases"><img alt="GitHub All Releases" src="https://img.shields.io/github/downloads/longsightedfilms/meshhouse/total?style=for-the-badge"></a>
    <a href="https://travis-ci.org/longsightedfilms/meshhouse"><img alt="Travis CI" src="https://img.shields.io/travis/longsightedfilms/meshhouse?style=for-the-badge"></a>
    <a href="#"><img alt="Codacy branch grade" src="https://img.shields.io/codacy/grade/8cab34754cd04f4186700e485ba74db9/dev?style=for-the-badge"></a>
    <a href="https://github.com/longsightedfilms/meshhouse/blob/dev/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/longsightedfilms/meshhouse?style=for-the-badge"></a>
</p>

> Open-source program for catalogizing 3d models. Built on [Typescript](https://www.typescriptlang.org/), [Vue](https://vuejs.org/) and [Electron](https://electronjs.org/).

## Features

* Integrations with your favourite sites
* Adding local catalogs
* Filter your model collection
* Localization support

## Integrations

|Integration name|URL|Status|Filters|Installation|Authentication|Purchase|
|---|---|---|---|---|---|---|
|Meshhouse|[https://meshhouse.art](https://meshhouse.art)|❌|❌|❌|❌|❌|


Legend:
+ Status - is integration available to use
+ Filters - is any custom filters ready
+ Installation - is model ready to install (to custom directories)
+ Authentication - is user can authenticate to site
+ Purchase (in case of paid sites) - is user can purchase models within application

## Localization

* English
* Russian

## Releases

Starting from v0.2.5 you can find releases and pre-releases at [https://github.com/longsightedfilms/meshhouse/releases](https://github.com/longsightedfilms/meshhouse/releases)

## Build

Build for Windows (x64)
```
npm run electron:build:win
```
Build for MacOS (not tested)
```
npm run electron:build:mac
```
Build for Linux
```
npm run electron:build:linux
```

### License

Code released under [Mozilla Public License 2.0](https://github.com/longsightedfilms/meshhouse/blob/dev/LICENSE)
