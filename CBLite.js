import {manager, ReactCBLite} from 'react-native-couchbase-lite'

import {
  find,
} from 'lodash/collection'

const dbName = 'test'

class CBLite {
  constructor() {
    this._database = new manager(`http://admin:pass@localhost:5984/`, dbName)
    this._remoteDbUrl = `http://localhost:4984/test`

    new Promise((resolve, reject) => {
      ReactCBLite.init(5984, 'admin', 'pass', error => {
        error ? reject(error) : resolve()
      })
    }).then(() => {
      return this._database.createDatabase()
    }).then(res => {
      if(res.status == 201) {
        console.log('created database!', res)
      }
    })
  }

  getDatabase() {
    return this._database
  }

  getRemoteDbUrl() {
    return this._remoteDbUrl
  }

  initialize(myId) {
    // setup and start replicating. 
    this._database.replicate(dbName, this._remoteDbUrl, true)
    this._database.replicate(this._remoteDbUrl, dbName, true)

    this._database.getAllDocumentConflicts().then(result => {
      result.rows.forEach(this.resolveConflicts)
    }).then(() => {
      return this._database.makeRequest("POST", this._database.databaseUrl + this._database.databaseName + '/_compact')
    }).then(result => console.log(result))
  }

  resolveConflicts(obj) {
    let i = obj.value._conflicts.length
    function processNext() {
      i--
      let conflictRev = obj.value._conflicts[i]
      if (!conflictRev) {
        return
      }
      //check to make sure the rev isn't newer or our current version. compare rev numbers only
      if (parseInt(conflictRev) >= parseInt(obj.value.rev)) {
        return processNext()
      }


      return this._database.deleteDocument(obj.id, conflictRev)
        .then(() => {
          return processNext()
        }).catch(e => {
          console.log(e)
          return processNext()
        })
    }
    return processNext()
  }
}

module.exports = new CBLite();