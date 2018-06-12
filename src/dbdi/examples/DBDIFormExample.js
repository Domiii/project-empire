import firebase from 'firebase/app';
import 'firebase/database';

import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'src/dbdi/firebase/FirebaseDataProvider';

import buildSourceTree from 'src/dbdi/DataSourceTree';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import size from 'lodash/size';
import pickBy from 'lodash/pickBy';
import sortBy from 'lodash/sortBy';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Panel, Button
} from 'react-bootstrap';
import Form from 'react-jsonschema-form';
import Moment from 'react-moment';

import dataBind from 'src/dbdi/react/dataBind';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import Markdown from 'src/views/components/markdown';



// #########################################################
// Remote (and in the future also local) data providers + data structure
// #########################################################

const dataProviders = {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider()
  //temp: new ...(),
  //webCache: ...
};

/**
  * The data tree represents all data made accessible via `DataSourceProvider`
  */
const dataStructureConfig = {
  auth: {
    dataProvider: 'firebaseAuth',
    children: {
      // currentUser represents everything provided by `firebaseAuth` provider
      currentUser: '',
      currentUid: 'uid'
    }
  },
  testData: {
    // we have a path `test` in our db which we can access via name `testData`
    dataProvider: 'firebase',
    path: 'test',
    readers: {
      sortedItemIds({ }, { }, { itemList }) {
        if (!itemList) return;
        const ids = Object.keys(itemList);
        return sortBy(ids, (itemId) => -itemList[itemId].updatedAt);
      }
    },
    children: {
      itemList: {
        // we have a path `test/items` which we can access via name `itemList`
        path: 'items',
        children: {
          item: {
            // we have many paths `test/items/$(itemId)` where we can access each via name `item` (with single argument `itemId`)
            path: '$(itemId)',
            onWrite(queryArgs, val) {
              val && (val.updatedAt = firebase.database.ServerValue.TIMESTAMP);
            },
            children: {
              // some child data here
            }
          }
        }
      }
    }
  }
};


// ##########################################################################
// Data Schema of our Form
// (as defined by `react-jsonschema-form` library)
// ##########################################################################

const FormSchema = {
  'title': '',
  'description': '',
  'type': 'object',
  'required': [
    'title'
  ],
  'properties': {
    'title': {
      'title': 'Title',
      'type': 'string'
    },
    'good': {
      'title': 'Good',
      'type': 'boolean'
    },
    'spirituality': {
      title: 'Spirituality',
      description: '<center><img src="https://i.imgur.com/xiQCNe7.png" /></center>',
      type: 'number',
      enum: [1, 2, 3],
      enumNames: ['one', 'two', 'three']
    },
    'difficulty': {
      title: 'Difficulty',
      type: 'number',
      minimum: 1,
      maximum: 4,
    },
    'other': {
      'title': 'Notes',
      'type': 'string'
    },
    'updatedAt': {
      'title': 'Last Updated',
      'type': 'number'
    }
  }
};


// ##########################################################################
// UI Schema for displaying our form
// (as defined by `react-jsonschema-form` library)
// ##########################################################################

const FormUISchema = {
  spirituality: {
    'ui:widget': 'radio',
    'ui:options': {
      inline: true
    }
  },
  difficulty: {
    'ui:widget': 'range',
    'ui:options': {
      inline: true
    }
  },
  updatedAt: {
    'ui:readonly': true,
    'ui:widget': 'momentTime'
  }
};

const CustomFields = {
  DescriptionField({ id, description }) {
    return (
      <Markdown id={id} className="field-description" source={description} />
    );
  }
};

const CustomWidgets = {
  momentTime({ value }) {
    return (!value && <span /> || <span>
      <Moment fromNow>{value}</Moment> (
        <Moment format="MMMM Do YYYY, hh:mm:ss">{value}</Moment>)
    </span>);
  },
};


// ##########################################################################
// Utilities
// ##########################################################################

const itemLog = (type) => console.log.bind(console, type);


// ##########################################################################
// ItemList component
// ##########################################################################

const ItemList = dataBind()(
  ({ }, { itemList, sortedItemIds }) => {
    if (!itemList.isLoaded()) {
      // not loaded yet
      return (<LoadIndicator block size="2em" />);
    }

    const items = itemList();
    const sortedIds = sortedItemIds();

    let i = 0;
    return (<div>
      {/* add new item item */}
      <Panel bsStyle="primary">
        <Panel.Heading>Add new</Panel.Heading>
        <Panel.Body>
          <ItemEditor itemId={null} />
        </Panel.Body>
      </Panel>

      {/* list all item items */}
      <h3>Your list currently has {size(items)} items</h3>
      {map(sortedIds, itemId => {
        const item = items[itemId];
        return (<Panel
          key={itemId} bsStyle={item.good ? 'success' : 'danger'}>
          <Panel.Heading>{`(${++i}) ${item.title}`}</Panel.Heading>
          <Panel.Body>
            <ItemEditor itemId={itemId} />
          </Panel.Body>
        </Panel>);
      })}

      {/* Debug data view */}
      <Panel bsStyle="warning">
        <Panel.Heading>Debug data view</Panel.Heading>
        <Panel.Body>
          <pre>{JSON.stringify(items, null, 2)}</pre>
        </Panel.Body>
      </Panel>
    </div>);
  }
);


// ##########################################################################
// ItemEditor + related components
// ##########################################################################

function ItemDeleteButton({ open }) {
  return (<Button bsStyle="warning" onClick={open}>
    <FAIcon name="trash" /> Delete!
  </Button>);
}
ItemDeleteButton.propTypes = {
  open: PropTypes.func.isRequired
};

const ItemEditor = dataBind({
  /**
   * DI-decorated action: create or update item
   */
  onSubmit({ formData }, { itemId }, { set_item, push_item }, { }) {
    // get rid of undefined fields, created by (weird) form editor
    formData = pickBy(formData, val => val !== undefined);

    if (!itemId) {
      // new item data
      push_item(formData);
    }
    else {
      // existing item data
      set_item({ itemId }, formData);
    }
  },

  /**
   * DI-decorated action: delete item
   */
  doDelete({ itemId }, { delete_item }, { }) {
    return delete_item({ itemId });
  }
})(
  /**
   * The actual render function for ItemEditor
   * (of course, also with DI)
   */
  ({ itemId }, { onSubmit, doDelete, item }) => {
    const alreadyExists = !!itemId;
    const data = alreadyExists && item({ itemId }) || EmptyObject;
    return (<div>
      <Form schema={FormSchema}
        liveValidate={true}
        uiSchema={FormUISchema}
        fields={CustomFields}
        widgets={CustomWidgets}
        formData={data}
        showErrorList={false}
        onChange={itemLog('changed')}
        onError={itemLog('errors')}
        onSubmit={onSubmit} >
        {/* the Form children are rendered at the bottom of the form */}
        <div>
          <button type="submit" className="btn btn-info">
            {alreadyExists ? 'Update' : 'Add new'}
          </button>
          {alreadyExists &&
            <ConfirmModal
              header="Confirm DELETE"
              ButtonCreator={ItemDeleteButton}
              onConfirm={doDelete}>

              <span>{data.title}</span>
            </ConfirmModal>
          }
        </div>
      </Form>
    </div>);
  }
);


// ##########################################################################
// Wrap everything in DataSourceProvider, and go!
// ##########################################################################

//const dataSourceTree = buildSourceTree(dataProviders, dataStructureConfig, plugins);
let dataSourceTree;

const WrappedView = ({ }) => {
  dataSourceTree = dataSourceTree || buildSourceTree(dataProviders, dataStructureConfig);
  
  return (<DataSourceProvider dataSourceTree={dataSourceTree}>
    <ItemList />
  </DataSourceProvider>);
};

export default WrappedView;