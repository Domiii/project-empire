import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { 
  Alert, Button, Modal
} from 'react-bootstrap';
import { FAIcon } from 'src/views/components/util';
import autoBind from 'react-autobind';


export function DefaultButtonCreator({open, iconName, className}) {
  return (
    <Button onClick={open} 
      className={className}
      bsSize="small"
      bsStyle="danger">

      <FAIcon name={iconName || 'trash'}  />
    </Button>
  );
}


export default class ConfirmModal extends Component {
  static propTypes = {
    header: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string
    ]),
    body: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string
    ]),
    ButtonCreator: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
  };

  constructor(...args) { 
    super(...args); 
    this.state = { showModal: false };

    autoBind(this);
  }

  open() { this.setState({ showModal: true }); }
  close() { this.setState({ showModal: false }); }

  onClickConfirm() {
    const {
      onConfirm,
      confirmArgs
    } = this.props;

    onConfirm(confirmArgs);
    this.close();
  }

  render() {
    // data
    const { 
      header,
      body,
      ButtonCreator
    } = this.props;

    // actions
    const {
      open, close, onClickConfirm
    } = this;

    const modalStyle = {
      display: 'inline'
    };

    // modal setup
    const modalContents = this.state.showModal && (
      <Modal style={modalStyle}
          show={this.state.showModal} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>{header}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {body}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={ onClickConfirm }
            bsStyle="danger">
            Yes
          </Button>
          <Button onClick={ close }
            bsStyle="primary"
            bsSize="large">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    ) || undefined;

    return (
      <span>
        { <ButtonCreator open={open} /> }

        { modalContents }
      </span>
    );
  }
};