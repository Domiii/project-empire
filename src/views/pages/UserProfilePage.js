import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { dataBind } from 'dbdi/react';

import DynamicForm from 'src/views/tools/DynamicForm';
import {
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';
import FAIcon from 'src/views/components/util/FAIcon';
import { LoadOverlay } from 'src/views/components/overlays';


export const schemaTemplate = {
  name: 'userData',
  type: 'object',
  properties: [
    {
      id: 'fullName',
      title: '全名',
      type: 'string',
      isOptional: false
    },
    // {
    //   id: 'displayName',
    //   title: 'Name',
    //   type: 'string',
    //   isOptional: false
    // },
    {
      id: 'photoURL',
      // if(formData) {
      //   return !!formData && !!formData.createdAt;
      // },

      title: 'Photo URL',
      type: 'string',
      isOptional: false
    }
  ]
};

const uiSchema = {
  'ui:options': {
    inline: false
  },
  fullName: {
    'ui:placeholder': '你的全名',
    'ui:options': {
      inline: true
    }
  },
  // displayName: {
  //   'ui:placeholder': '你的 display name',
  //   'ui:options': {
  //     inline: true
  //   }
  // },
  photoURL: {
    'ui:widget': 'userIcon',
    'ui:placeholder': '你的圖片',
    'ui:options': {
      inline: true
    }
  }
};



@dataBind({

})
export default class UserProfilePage extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      isSaved: true
    };
  }

  onStateChange = ({ isSaved }) => {
    this.setState({ isSaved });
    //console.log('onStateChange', isSaved);
  }

  render(
    { },
    { currentUser, setCurrentUserData },
    { }
  ) {
    const props = {
      schemaTemplate,
      uiSchema,

      reader: currentUser,
      writer: setCurrentUserData,

      onStateChange: this.onStateChange
    };

    const {
      isSaved
    } = this.state;

    return (<DynamicForm {...props}>
      <div>
        {/* the Form children are rendered at the bottom of the form */}
        <Button disabled={isSaved} type="submit" bsStyle="info">
          <FAIcon name="save" /> Save!
        </Button>
      </div>
    </DynamicForm>);
  }
}