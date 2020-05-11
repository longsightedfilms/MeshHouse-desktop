import fs from 'fs'
import path from 'path'
import ElectronStore from 'electron-store'
import Integrations from './integrations/main'

const dcc: ElectronStore<any> = new ElectronStore({ name: 'dcc-config' })
const databases: ElectronStore<any> = new ElectronStore({ name: 'databases' })

export const modelsExtensions: Extension = {
  '.max': {
    title: '3ds Max Scene',
    icon: 'max',
  },
  '.ma': {
    title: 'Maya ASCII Scene',
    icon: 'maya',
  },
  '.mb': {
    title: 'Maya Binary Scene',
    icon: 'maya',
  },
  '.blend': {
    title: 'Blender Scene',
    icon: 'blender',
  },
  '.c4d': {
    title: 'Cinema 4D Scene',
    icon: 'cinema4d',
  },
  '.hip': {
    title: 'Houdini Scene',
    icon: 'houdini',
  },
  '.hiplc': {
    title: 'Houdini Scene',
    icon: 'houdini',
  },
  '.hipnc': {
    title: 'Houdini Scene',
    icon: 'houdini',
  },
  '.lxo': {
    title: 'Modo Scene',
    icon: 'modo',
  },
}

export function filterByModels(file: string, stats: fs.Stats): boolean {
  return (
    !stats.isDirectory() && !modelsExtensions.hasOwnProperty(path.extname(file))
  )
}

export function getParameterByExtension(extension: string, param: string): string {
  switch (extension) {
    case '.max':
      return dcc.get('adsk3dsmax.' + param)
    case '.ma':
    case '.mb':
      return dcc.get('adskMaya.' + param)
    case '.blend':
      return dcc.get('blender.' + param)
    case '.c4d':
      return dcc.get('cinema4d.' + param)
    case '.hip':
    case '.hiplc':
    case '.hipnc':
      return dcc.get('houdini.' + param)
    case '.lxo':
      return dcc.get('modo.' + param)
    default:
      return ''
  }
}
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Database handling

export function findDatabaseIndex(url: string): number {
  return databases.get('databases').findIndex((db: DatabaseItem) => db.url === url)
}

export function handleDatabases(database: DatabaseItem | string): PossibleIntegrations {
  let searchableDB

  if (typeof database === 'string') {
    searchableDB =  databases.get('databases')[findDatabaseIndex(database)]
  } else {
    searchableDB = database
  }
  const dbType = searchableDB.localDB ? 'local' : searchableDB.url

  return dbType === 'local' ? new Integrations.local(searchableDB.url) : null//new Integrations[dbType]()
}

