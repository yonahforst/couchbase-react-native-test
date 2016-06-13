/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
} from 'react-native';

import CBLite from './CBLite'

const dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
const database = CBLite.getDatabase()

class UntitledApp extends Component {
  state = {
    revs: {}
  }

  componentDidMount() {
    CBLite.initialize(1234)

    database.getInfo()
    .then((res) => {
      database.listen({
        since: res.update_seq - 1, 
        feed: 'longpoll', 
        include_docs: true,
      })
      database.changesEventEmitter.on('changes', this.handleChanges.bind(this))
    })
  }

  handleChanges(changes) {
    let revs = this.state.revs
    changes.results.forEach(res => {
      if (res.doc) {
        if (!revs[res.doc._id] || res.doc._rev > revs[res.doc._id]) {
          revs[res.doc._id] = res.doc._rev
        }
      }
    })
    this.setState({revs: revs})
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView 
        enableEmptySections={true}
        dataSource={dataSource.cloneWithRows(Object.keys(this.state.revs))}
        renderRow={id => <Text>{id.split('-')[0]}: {this.state.revs[id].split('-')[0]}</Text>}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },

});

AppRegistry.registerComponent('UntitledApp', () => UntitledApp);
