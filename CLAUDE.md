# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page shopping list web app built with no framework: plain HTML, CSS, and vanilla JavaScript. There is no build step, package manager, or test suite. Open `index.html` directly in a browser to run it.

## Architecture

- **`index.html`** — markup plus inline bootstrap config. Loads `@supabase/supabase-js@2` from jsDelivr, then sets `window.SUPABASE_URL` / `window.SUPABASE_ANON_KEY` in an inline `<script>`, then loads `app.js`. The `<template id="item-template">` defines each list row and is cloned per item in `render()`.
- **`style.css`** — all styling. Theming is driven by CSS custom properties on `:root`, with a dark palette swapped in under `@media (prefers-color-scheme: dark)`. Class names follow a BEM-style convention (`block__element--modifier`, e.g. `list__item--checked`).
- **`app.js`** — the whole application, wrapped in an IIFE with `"use strict"`. Structure:
  - Module-level `items` array is the single source of truth (`{ id, text, checked }`).
  - `load` / `addItem` / `toggleItem` / `deleteItem` / `clearChecked` are async and talk to the Supabase table `shopping_items_2` (columns: `id`, `text`, `checked`, `created_at`).
  - Mutations use **optimistic updates**: mutate `items`, call `render()`, then on Supabase error roll back to the saved previous state and re-render.
  - `render()` fully rebuilds the list (`listEl.textContent = ""` then re-append clones) and recomputes the summary line, empty-state visibility, and the "clear checked" button visibility.
  - Event handling is delegated on `listEl`: `change` for checkbox toggles, `click` for delete buttons; the row's `dataset.id` links a DOM node back to its item.

## Important notes

- Data persists to Supabase (Postgres), not `localStorage`. There is no `localStorage` fallback — if Supabase config or the CDN script is missing, `db` is `null` and every operation silently no-ops after logging to console.
- The anon/publishable Supabase key in `index.html` is intended to be public and is expected to be protected by Row Level Security on the `shopping_items_2` table. Schema changes and RLS policies live in the Supabase project, not in this repo.
- UI text and comments are in Korean; keep that convention.
