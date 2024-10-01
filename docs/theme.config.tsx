
import type { DocsThemeConfig } from 'nextra-theme-docs'
// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';

const config: DocsThemeConfig = {
  logo: <>
    <img src="https://github.com/ocoda/.github/raw/master/assets/ocoda_logo_only_gradient.svg" width="40" alt="Ocoda Logo" />
    <span style={{ marginLeft: '.4em', fontWeight: 700 }}>
        Ocoda | Event Sourcing
      </span>
  </>,
  project: {
    link: 'https://github.com/ocoda/event-sourcing',
  },
  docsRepositoryBase: 'https://github.com/ocoda/event-sourcing/tree/master/docs',
  footer: {
    text: (
        <span>
          MIT {new Date().getFullYear()} ©{' '}
          <a href="https://nextra.site" target="_blank" rel="noreferrer">
            Ocoda
          </a>
          .
        </span>
      )
  },
  useNextSeoProps(...rest) {
    console.log(rest)
    return {
        titleTemplate: '%s | Ocoda Event Sourcing',
      }
  },
}

export default config