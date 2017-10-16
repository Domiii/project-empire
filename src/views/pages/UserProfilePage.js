import { UserInfo } from 'src/core/users';

import React, { Component, PropTypes } from 'react';
import autoBind from 'react-autobind';
import dataBind from 'src/dbdi/react/dataBind';

import Form from 'react-jsonschema-form';
import { 
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';
import { SimpleGrid, FormInputField, FAIcon } from 'src/views/components/util';
import { LoadOverlay } from 'src/views/components/overlays';

@dataBind({

})
export default class UserProfilePage extends Component {
  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  updateUser({}, { setUserData }, {}) {

  }

  render({ }, { }, { currentUser_isLoaded }) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }

    return (<Form schema={FormSchema}
      liveValidate={true}
      uiSchema={FormUISchema}
      widgets={widgets}
      formData={project}
      showErrorList={false}
      onSubmit={onSubmit}
    >
      {/* the Form children are rendered at the bottom of the form */}
      <div>
        <button type="submit" className="btn btn-info">
          <FAIcon name="save" /> {alreadyExists ? 'Update' : 'Add new'}
        </button>
      </div>
    </Form>);
  }
}