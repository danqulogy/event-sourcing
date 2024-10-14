<p align="center">
  <a href="http://ocoda.io/" target="blank"><img src="https://github.com/ocoda/.github/raw/master/assets/ocoda_logo_full_gradient.svg" width="600" alt="Ocoda Logo" /></a>
</p>

<p align="center">
  <a href="https://github.com/ocoda/event-sourcing/actions/workflows/ci-libraries.yml">
    <img src="https://github.com/ocoda/event-sourcing/actions/workflows/ci-libraries.yml/badge.svg">
  </a>
  <a href="https://codecov.io/gh/ocoda/event-sourcing">
    <img src="https://codecov.io/gh/ocoda/event-sourcing/branch/master/graph/badge.svg?token=D6BRXUY0J8">
  </a>
  <a href="https://github.com/ocoda/event-sourcing/blob/master/LICENSE.md">
    <img src="https://img.shields.io/badge/License-MIT-green.svg">
  </a>
</p>
<p align="center">
    <a href="https://github.com/ocoda/event-sourcing/issues/new?labels=bug&template=bug_report.md">Report a bug</a>
    &nbsp;|&nbsp;
    <a href="https://github.com/ocoda/event-sourcing/issues/new?labels=enhancement&template=feature_request.md">Request a feature</a>
</p>

## About this library

This is a complementing module for `@ocoda/event-sourcing`, a powerful library designed to simplify the implementation of advanced architectural patterns in your [**NestJS**](https://nestjs.com/) application. It provides essential building blocks to help you implement Domain-Driven Design (DDD), CQRS and leverage Event Sourcing to tackle the complexities of modern systems.

This store-driver library uses [DynamoDB](https://aws.amazon.com/dynamodb/) as an underlying driver for event- and snapshot-stores, and needs to be installed together with the core module `@ocoda/event-sourcing` in order to get started.

## Documentation 📗
Ready to dive right in? Visit [the documentation](https://ocoda.github.io/event-sourcing) to find out how to get started.

## Contact
dries@drieshooghe.com
&nbsp;

## Acknowledgments
This library is inspired by [@nestjs/cqrs](https://github.com/nestjs/cqrs)