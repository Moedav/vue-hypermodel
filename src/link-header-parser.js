/*
* Copyright 2013 Thorsten Lorenz. (parse-link-header)
* Modified by David Mödl
* */
import qs from 'querystring'
function hasRel (x) {
  return x && x.rel
}

function intoRels (acc, x) {
  function splitRel (rel) {
    acc[rel] = Object.assign(x, { rel: rel })
  }

  x.rel.split(/\s+/).forEach(splitRel)

  return acc
}

function createObjects (acc, p) {
  // rel="next" => 1: rel 2: next
  const m = p.match(/\s*(.+)\s*=\s*"?([^"]+)"?/)
  if (m) acc[m[1]] = m[2]
  return acc
}

function parseLink (link) {
  try {
    const m = link.match(/<?([^>]*)>(.*)/)
    const linkUrl = m[1]
    const parts = m[2].split(';')
    const urlObj = new URL(linkUrl)
    const qry = qs.parse(urlObj.search.substring(1))

    parts.shift()

    let info = parts.reduce(createObjects, {})
    info.params = qry
    info.link = linkUrl
    info.href = urlObj.origin + urlObj.pathname
    return info
  } catch (e) {
    return null
  }
}

export default function (linkHeader) {
  if (!linkHeader) return null

  return linkHeader.split(/,\s*</).map(parseLink).filter(hasRel).reduce(intoRels, {})
}
