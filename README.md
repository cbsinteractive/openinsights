# Open Insights

Open Insights is a framework for constructing browser-based RUM clients.

It allows a site owner to construct their own client using one or more "providers".
The client is then self-hosted and deployed alongside the rest of their JavaScript
resources.

This repository contains the framework "core" component. This component is meant
to be added to the site ownder's project along with one or more providers. The
providers are then imported by the site owner's code, and everything is compiled
to produce a client JavaScript file deployable to production.

See [Open Insights CBSi Demo](https://github.com/cbsinteractive/open-insights-cbsi-demo)
for a demonstration of how to compile a client.

## Why Use It

1. Open Insights represents a collaboration by industry members to measure, and ultimately
   improve, the internet as a whole.
1. Open Insights is designed to work with multiple vendors.
1. Open Insights is meant to be self-hosted, unlike many vendor-centric, browser-based
   RUM clients.
1. Open Insights gives the site owner control over code compilation and included
   functionality.

## Development

In most cases, developers will reference the core module as a dependency, using it to
compile a customized client for use on their sites. These instructions are for working
on the core module itself.

### Install Dependencies

Within the project root directory:

```shell
npm install
```

### Run Linter

```shell
npm run lint
```

### Run Tests

```shell
npm test
```

### Build Code Documentation

```shell
npm run build:doc
```

### Publish

Install prerequesite:

```shell
npm install --global np
```

Build release and publish to npm:

```shell
npm run build:release
np
```
