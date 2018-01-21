#!/usr/bin/env node

const
  { writeFileSync } = require('fs'),
  kebabCase = require('lodash.kebabcase'),
  cloneDeep = require('lodash.clonedeep'),
  beautify = require('json-beautify'),
  Quasar = require('quasar-framework/dist/umd/quasar.mat.umd')

const
  cache = {},
  components = Quasar.components

const PropTypeMap = new Map([
  [String, { type: 'string', description: 'String value.' }],
  [Boolean, { type: 'boolean', description: 'Boolean value.' }],
  [Number, { type: 'number', description: 'Number value.' }],
  [Array, { type: 'array', description: 'Array value.' }],
  [Object, { type: 'object', description: 'Object value.' }],
  [Function, { type: 'function', description: 'Function value.' }],
  [RegExp, { type: 'RegExp', description: 'RegExp value.' }],
  [Date, { type: 'Date', description: 'Date value.' }]
])

function addProps (comp, list) {
  if (comp.props) {
    Object.keys(comp.props).forEach(name => {
      list[kebabCase(name)] = comp.props[name]
    })
  }
}

function parseComponent (comp, list) {
  const
    name = comp.name,
    cached = name !== void 0 ? cache[comp.name] : false

  if (cached) {
    Object.assign(list, cached)
    return
  }

  if (comp.mixins) {
    comp.mixins.forEach(mixin => {
      parseComponent(mixin, list)
    })
  }

  addProps(comp, list)
  if (name) {
    cache[name] = cloneDeep(list)
  }
}

function getTags (cache) {
  const tags = {}
  Object.keys(cache).forEach(name => {
    tags[name] = {
      attributes: Object.keys(cache[name]),
      description: ''
    }
  })
  return tags
}

function getAttributes (cache) {
  const attrs = {}
  Object.keys(cache).forEach(name => {
    const props = cache[name]
    Object.keys(props).forEach(prop => {
      let entry
      let type = props[prop].type || 'any'
      if (Array.isArray(type)) {
        types = type.map(val => {
          const v = PropTypeMap.get(val)
          if (!PropTypeMap.has(val)) {
            console.error(nsKey, v)
          }
          else {
            return PropTypeMap.get(val).type
          }
        })
        type = types.join('|')
        let description = 'One of '
        if (types.length == 2) {
          description += `${types[0]} or ${types[1]}.`
        }
        else {
          for (let i = 0; i < types.length; i++) {
            if (i < types.length - 1) {
              description += `${types[i]}, `
            } else {
              description += `or ${types[i]}.`
            }
          }
        }
        entry = {
          type,
          description
        }
      }
      else {
        entry = PropTypeMap.get(type)
      }

      attrs[`${name}/${prop}`] = entry
    })
  })
  return attrs
}

Object.keys(components).forEach(name => {
  const list = {}
  parseComponent(components[name], list)
})

writeFileSync('../quasar-tags.json', beautify(
  getTags(cache),
  null, 2, 1
))

writeFileSync('../quasar-attributes.json', beautify(
  getAttributes(cache),
  null, 2, 1
))
