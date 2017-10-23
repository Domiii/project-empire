import firebase from 'firebase';
import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'src/dbdi/firebase/FirebaseDataProvider';

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
import LoadIndicator from 'src/views/components/util/loading';
import ConfirmModal from 'src/views/components/util/ConfirmModal';



// #########################################################
// Remote (and in the future also local) data providers + data structure
// #########################################################

const dataConfig = {
  dataProviders: {
    firebase: new FirebaseDataProvider(),
    firebaseAuth: new FirebaseAuthProvider()
    //temp: new ...(),
    //webCache: ...
  },

  /**
    * The data tree represents all data made accessible via `DataSourceProvider`
    */
  dataStructureConfig: {
    auth: {
      dataProvider: 'firebaseAuth',
      children: {
        // currentUser represents everything provided by `firebaseAuth` provider
        currentUser: '',
        currentUid: 'uid'
      }
    },
    testData: {
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
          path: 'items',
          children: {
            item: {
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
      'type': 'string',
      'title': 'Title'
    },
    'good': {
      'type': 'boolean',
      'title': 'Good'
    },
    'other': {
      'type': 'string',
      'title': 'Other'
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
  'updatedAt': {
    'ui:readonly': true,
    'ui:field': 'momentTime'
  }
};

const CustomFields = {
  momentTime: ({ formData, schema: { title } }) => {
    return (!formData && <span /> || <span>
      <label>{title}</label>{' '}
      <Moment fromNow>{formData}</Moment> (
        <Moment format="MMMM Do YYYY, h:mm:ss a">{formData}</Moment>)
    </span>);
  }
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
      <Panel header="Add new" bsStyle="primary">
        <ItemEditor itemId={null} />
      </Panel>

      {/* list all item items */}
      <h3>Your list currently has {size(items)} items</h3>
      {map(sortedIds, itemId => {
        const item = items[itemId];
        return (<Panel 
          key={itemId} bsStyle={item.good ? 'success' : 'danger'}
          header={`(${++i}) ${item.title}`}>
          <ItemEditor itemId={itemId} />
        </Panel>);
      })}

      {/* Debug data view */}
      <Panel header="Debug data view" bsStyle="warning">
        <pre>{JSON.stringify(items, null, 2)}</pre>
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
  onSubmit({ formData }, { itemId }, { set_item, push_item }, {}) {
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
  doDelete({ itemId }, { delete_item }, {}) {
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

const WrappedView = ({ }) => (
  <DataSourceProvider {...dataConfig}>
    <ItemList />
  </DataSourceProvider>
);

export default WrappedView;