import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { BiXCircle } from "react-icons/bi";
import Box from "@mui/material/Box";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  useGridApiRef,
} from "@mui/x-data-grid";
import { Button } from "@mui/material";
import "../Components/Styles/TableData.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Axios from "../Utils/Axios";
import { addImportedUserLogs, clearImportedUser } from "../store/auth0Slice";
import ExportExcel from "./ExcelExport";

const TableData = ({
  data,
  tableHeader = "USERS LIST",
  setTableData,
  setIsPasteCancel,
  setIsPasteModelShow,
  isTableShow,
  setIsTableShow,
}) => {

  const gridApiRef = useGridApiRef();
  const userInfo = useSelector((state) => state.auth0Context);
  const dispatch = useDispatch();
  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "UserEmail", headerName: "UserEmail", width: 250, editable: true },
    { field: "Password", headerName: "Password", width: 250, editable: true },
    {
      field: "Connection", headerName: "Connection", width: 250,
    },
  ];
  const [isActivateConfirmModal, setIsActivateConfirmModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [confirmationModalData, setConfirmationModalData] = useState({ id: "", header: "", content: "", });

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </GridToolbarContainer>
    );
  };

  const getImportedUsers = async (id) => {
    if (id === "m1") {
      await createUsers(getSelectedValue())
        .finally((_) => {
          // toast(CustomToastWithLink, { theme: "light", autoClose: false }) -- inticating with excel export (logs)
          toast(`Users has been imported to system.`, { theme: "colored", type: "info" })
          setIsTableShow(false);
          setIsActivateConfirmModal(false);
          setSelectedRows([]);
        })
    }
    if (id === "c1") {
      setTableData([]);
      setIsActivateConfirmModal(false);
    }
  };

  const getEditedValues = () => {
    let editedValue = [];
    gridApiRef.current.getRowModels().forEach((val) => {
      if (val) {
        editedValue?.push(val);
      }
    });
    if (editedValue) {
      setTableData(editedValue);
    }
    return editedValue;
  };

  const getSelectedValue = () => {
    let fileredData = [];
    selectedRows?.forEach((selectValueId) => {
      let foundedData = getEditedValues()?.find(
        (ele) => ele.id === selectValueId
      );
      if (foundedData) {
        fileredData.push(foundedData);
      }
    });
    return fileredData;
  };

  const onImport = () => {
    if (selectedRows?.length === 0) {
      toast.warn("Please select atleast one row", { theme: "colored" });
      return;
    }

    if (selectedRows?.length === 20) {
      toast.warn("Please import only 20 rows", { theme: "colored" });
      return;
    }
    setConfirmationModalData({
      id: "m1",
      header: "Confirmation Import user",
      content: `Are you sure want to import the ${(selectedRows.length > 1) ? 'users?' : 'user?'}`,
    });

    setIsActivateConfirmModal(true);
  };

  const getAuthToken = async () => {
    let body =
    {
      client_id: process.env.REACT_APP_AUTH_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.REACT_APP_AUTH_MANAGEMENT_CLIENT_SECRET,
      audience: process.env.REACT_APP_AUTH_MANAGEMENT_AUDIENCE,
      grant_type: process.env.REACT_APP_AUTH_GRANT_TYPE,
    };

    return await Axios(
      "https://dev-34chvqyi4i2beker.jp.auth0.com/oauth/token",
      "POST",
      body,
      null
    )
      .then(async (managementToken) => {
        return managementToken;
      })
      .catch((error) => {
        return `Error ::", ${error}`;
      });
  };

  const CustomToastWithLink = () => {
    return (
      <div>
        <ExportExcel excelData={userInfo.importedUserLogs} fileName={'Imported User'} />
      </div>
    );
  }


  const createUsers = async (usersList) => {

    if (usersList.length === 0)
      return;

    let managementAccessToken = null;
    await getAuthToken().then((managementResponse) => {
      managementAccessToken = managementResponse?.access_token
    });
    usersList.forEach(async (user) => {
      if (userInfo?.accessToken && userInfo?.accessToken?.length > 0 && managementAccessToken != null) {
        await createUser(user, managementAccessToken);
      };
    })
    dispatch(clearImportedUser());

  };

  const logCurrentUserObject = (user, status, response) => {
    const logObject = { isAdded: status, message: response };
    const data = { ...user, ...logObject };
    dispatch(addImportedUserLogs({ userLog: data }))
  }

  const createUser = async (user, accessToken) => {
    let body =
    {
      email: user?.UserEmail,
      connection: user?.Connection,
      password: user?.Password
    };

    await Axios("https://dev-34chvqyi4i2beker.jp.auth0.com/api/v2/users", "POST", JSON.stringify(body), accessToken, true)
      .then((addedUser) => {
        if (addedUser.hasOwnProperty("response")) {
          logCurrentUserObject(user, false, JSON.stringify(addedUser?.response));
          return;
        }

        logCurrentUserObject(user, true, JSON.stringify(addedUser))
      })
      .catch((error) => {
        if (JSON.stringify(error) !== "{}") {
          logCurrentUserObject(user, false, JSON.stringify(error))
        }
      })
  };

  return (
    <>
      {isTableShow && (
        <div>
          <Modal
            className="tableDataModal"
            size="lg"
            show={data.length !== 0 ? true : false}
            aria-labelledby="contained-modal-title-vcenter"
            centered
          >
            <Modal.Body>
              <Row
                style={{
                  display: "felx",
                  alignItems: "center",
                  padding: "10px 0",
                }}
              >
                <Col>
                  <h4>{tableHeader}</h4>
                </Col>
                <Col style={{ textAlign: "end" }}>
                  <BiXCircle
                    className="fs-2"
                    style={{ opacity: "0.9", margin: "10px 0", cursor: "pointer" }}
                    onClick={() => {
                      setTableData([]);
                      setIsPasteCancel(true);
                    }}
                  />
                </Col>
              </Row>

              {data.length !== 0 && (
                <Box sx={{ height: 400, width: "100%" }}>
                  <DataGrid
                    slotProps={{ panel: { disablePortal: true } }}
                    rows={data}
                    onRowSelectionModelChange={(newRowSelectionModel) => {
                      setSelectedRows(newRowSelectionModel);
                    }}
                    onStateChange={() => {
                      // getEditedValues();
                    }}
                    columns={columns}
                    apiRef={gridApiRef}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 5,
                        },
                      },
                    }}
                    pageSizeOptions={[5]}
                    slots={{
                      toolbar: CustomToolbar,
                    }}
                    checkboxSelection
                    disableRowSelectionOnClick
                  />
                </Box>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setIsActivateConfirmModal(true);
                  setConfirmationModalData({
                    id: "c1",
                    header: "Cancel",
                    content: "Are you sure want to cancel the process?",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                color="info"
                className="mx-2"
                onClick={() => setTableData([])}
              >
                reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                className="mx-2"
                onClick={() => {
                  onImport();
                }}
              >
                Import User
              </Button>
            </Modal.Footer>
          </Modal>
          {isActivateConfirmModal && (
            <Modal
              className="confirmationModal"
              size="lg"
              show={true}
              aria-labelledby="contained-modal-title-vcenter"
              centered
              onHide={() => setIsActivateConfirmModal(false)}
            >
              <Modal.Header closeButton>
                <h6>{confirmationModalData?.header}</h6>
              </Modal.Header>
              <Modal.Body>
                <p>{confirmationModalData?.content}</p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setIsActivateConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  className="mx-2"
                  onClick={() => {
                    getImportedUsers(confirmationModalData?.id);
                  }}
                >
                  OK
                </Button>
              </Modal.Footer>
            </Modal>
          )}
        </div>
      )}
    </>
  );
};

export default TableData;
