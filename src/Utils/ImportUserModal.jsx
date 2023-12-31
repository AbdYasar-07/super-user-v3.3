import React from "react";
import Modal from "react-bootstrap/Modal";
import { BiPaste, BiXCircle } from "react-icons/bi";
import "../Components/Styles/ImportUserModal.css";
import { toast } from "react-toastify";

const ImportUserModal = ({
  isPasteModelShow,
  setIsPasteCancel,
  setTableData,
  setIsTableShow,
}) => {
  const isValid = (values) => {
    let isCorrect = false;
    if (values) {
      values.forEach((value) => {
        let keyValues = Object?.keys(value);
        if (
          keyValues.length === 4 &&
          keyValues.includes("UserEmail") &&
          keyValues.includes("Password") &&
          keyValues.includes("Connection") &&
          keyValues.includes("id")
        ) {
          isCorrect = true;
        }
      });
    }
    return isCorrect;
  };
  const isJson = (clipboardData) => {
    try {
      if (clipboardData) {
        clipboardData = clipboardData.replace(
          /([{,])\s*([\w]+)\s*:/g,
          '$1"$2":'
        );
      }
      JSON.parse(clipboardData);
      return true;
    } catch (error) {
      return false;
    }
  };
  const arrayValueConvert = (clipboardData) => {
    const lines = clipboardData.trim().split("\r\n");
    const headers = lines[0].split("\t"); // Extract the headers
    const objects = [];

    for (let i = 1; i < lines.length; i++) {
      // Loop through the lines starting from the second line
      const values = lines[i].split("\t");
      const object = {};
      object["id"] = i;

      for (let j = 0; j < headers.length; j++) {
        // Create an object using headers and values
        object[headers[j]] = values[j];
      }

      objects.push(object);
    }
    if (!isValid(objects)) {
      toast.info("Invalid header received. Check copied header", { theme: "colored" });
      return;
    }
    setTableData(objects);
    setIsTableShow(true);

  };
  const jsonTodataCoverter = (clipboardData) => {
    if (clipboardData) {
      clipboardData = clipboardData.replace(/([{,])\s*([\w]+)\s*:/g, '$1"$2":');
    }
    var jsonObject = JSON.parse(clipboardData);
    let gridValues = [];

    jsonObject.forEach((object, index) => {
      object["id"] = index + 1;
      gridValues.push(object);
    });

    if (gridValues.length !== 0) {
      setTableData(gridValues);
      setIsTableShow(true);
    }
  };
  const getPastedValue = async () => {
    try {
      const clipboardData = await navigator.clipboard.readText();
      if (!clipboardData || clipboardData.length === "") {
        toast.info("Data is empty", { theme: "colored" });
        return;
      }
      if (isJson(clipboardData)) {
        jsonTodataCoverter(clipboardData);
      } else {
        arrayValueConvert(clipboardData);
      }
    } catch (error) {
      console.error("Failed to read clipboard data: ", error);
    }
  };

  return (
    <Modal
      onPaste={getPastedValue}
      className="importUserModal"
      size="lg"
      show={isPasteModelShow}
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Body>
        <div className="text-end">
          <BiXCircle
            className="fs-1"
            style={{ opacity: "0.5", cursor: "pointer" }}
            onClick={() => {
              setIsPasteCancel(true);
            }}
          />
          {/* <BiX className="fs-1"/> */}
        </div>
        <div className="text-center" style={{ padding: "110px" }}>
          <span
            className="rounded-circle bg-secondary"
            style={{
              width: "85px",
              display: "inline-block",
              height: "85px",
              lineHeight: "85px",
              color: "#0f0b0b",
              cursor: "pointer",
            }}
            onClick={getPastedValue}
          >
            <BiPaste className="fs-1" />
          </span>
          <p className="pt-2">Click on the paste icon (or) Ctrl+V</p>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ImportUserModal;
