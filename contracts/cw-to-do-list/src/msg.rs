use crate::state::{Entry, Priority, Status};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// Message for contract initializing
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    /// owner of this to do list
    pub owner: Option<String>,
}

/// Messages that can modify state
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    /// New to do list
    NewEntry {
        /// Description of the to do item
        description: String,
        /// Priority for the to do item
        priority: Option<Priority>,
    },
    /// Update to do list
    UpdateEntry {
        id: u64,
        /// updated description
        description: Option<String>,
        /// updated status
        status: Option<Status>,
        /// updated priority
        priority: Option<Priority>,
    },
    /// Delete to do list
    DeleteEntry {
        id: u64,
    },
}

/// Messages for viewing the state
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    /// Check to do item at id
    QueryEntry {
        id: u64,
    },
    /// List to do items with pagination
    QueryList {
        start_after: Option<u64>,
        limit: Option<u32>,
    },
}

/// Returned to do item from QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct EntryResponse {
    pub id: u64,
    pub description: String,
    pub status: Status,
    pub priority: Priority,
}

/// List of returned to do items from QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ListResponse {
    pub entries: Vec<Entry>,
}
