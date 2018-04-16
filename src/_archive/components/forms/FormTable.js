
export default class FormTable extends Component {
 render() {
  const {
   title,
   data
  } = this.props;
  
  return (<ListGroup>
    <ListGroupItem header={title} bsStyle="info">
    </ListGroupItem>
    {
     map(data, item => 
         <ListGroupItem key={item.desc}>{item.desc}</ListGroupItem>)
    }
   </ListGroup>);
  // return (<div>
  //   <BootstrapTable 
  //    data={data} striped={true} hover={true}>
  //    <TableHeaderColumn
  //     dataField="desc" isKey={true}
  //     dataAlign="left" dataSort={true}>
  //     {title}
  //    </TableHeaderColumn>
  //   </BootstrapTable>
  // </div>);
 }
}