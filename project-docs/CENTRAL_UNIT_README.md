# Safe Space — Central Unit

The Central Unit is the command and control hub of the Safe Space system. It receives incident data from road-side detection nodes and from the mobile app, processes it, coordinates responses, and communicates outcomes back to the road infrastructure and to the public.

---

## Overview

The Central Unit consists of three main parts:

- **Dashboard** — a web-based interface used by operators across five different roles
- **Backend** — handles all business logic, incident processing, and communication with nodes and the mobile app server
- **Database** — stores all incidents, user accounts, node data, actions, and historical records

---

## Incident Flow

### From a Detection Node
1. A road-side node detects an accident and sends the incident data (image + road polygon) to the Central Unit
2. The system analyzes which lanes are intersected by the accident
3. An AI-generated suggestion is produced, recommending which lanes to close and what speed limit to apply
4. The incident is assigned to a Road Observer who reviews, adjusts, and approves the suggestion
5. Once approved, the updated lane and speed configuration is sent back to the node for display, the Emergency Dispatcher is notified, and the mobile app server is notified so nearby users can receive real-time alerts
6. The dispatcher selects and logs which emergency units to send (ambulance, police, fire)
7. The Road Observer continues to monitor the incident — they can add further measures, request additional emergency units, or resolve the incident when it's clear

### From the Mobile App
- **Accident reports** follow the same flow as node detections — they go through the algorithm and land with a Road Observer
- **SOS / emergency requests** are routed directly to the Emergency Dispatcher, bypassing the Observer flow

---

## Roles & Responsibilities

### Administrator
The Administrator has full visibility and control over the entire system.

- Create, edit, and deactivate user accounts
- Assign roles to users (each user has exactly one role)
- View audit logs showing all actions taken by all users
- Monitor active sessions across the dashboard
- Intervene or override actions taken by any other role

### Node Maintainer
The Node Maintainer is responsible for the health and operation of all road-side detection nodes.

- View all nodes and their current status
- Monitor live vitals per node: CPU usage, memory, storage, temperature, camera status, GPS signal, uptime, and inference speed
- Receive automatic alerts when a node has a problem
- Send remote commands to nodes: restart the device, shut down individual components, update firmware, or change configuration
- **Restriction:** A node that is currently involved in an active open incident cannot be modified until the incident is resolved

### Road Observer
The Road Observer is the primary responder to road incidents.

- Receive real-time alerts for new incidents (from nodes and mobile app reports)
- View each incident on a map alongside a list of suggested actions
- Review the AI-generated suggestion and modify it as needed:
  - Toggle each affected lane individually (close or keep open)
  - Set a custom speed limit for the affected segment
- Approve the final configuration — changes take effect immediately with no additional confirmation step
- Own the incident throughout its lifecycle: add new measures, request more emergency units from the dispatcher, or mark the incident as resolved

**Assignment logic:** Incidents are automatically assigned to an available Road Observer. If all Observers are occupied, the incident is assigned to the least-loaded one. If the system determines no Observer can take it, it is queued and assigned as soon as one becomes available.

### Emergency Dispatcher
The Emergency Dispatcher coordinates the emergency response to confirmed incidents.

- Receive notifications for incidents that have been confirmed and approved by a Road Observer
- Receive SOS requests directly from mobile app users
- Log which emergency units are being dispatched (ambulance, police, fire) and add notes
- Mark an incident as a false alarm if appropriate
- Coordinate with the Road Observer when additional emergency units are requested

### Data Analyst
The Data Analyst works exclusively with historical data to identify patterns and improvement opportunities.

- Access historical records of all incidents, node performance, and operator actions
- View pre-built dashboards with graphs and metrics covering:
  - Accident frequency by location and time
  - Node performance and uptime trends
  - Incident response time analysis
  - Peak traffic and incident hours
  - Identification of weak or high-risk road segments
- Generate on-demand reports for deeper investigation

---

## Incident Lifecycle Summary

```
Incident detected (node or mobile app)
        ↓
Algorithm generates lane + speed suggestion
        ↓
Assigned to Road Observer
        ↓
Observer reviews → modifies if needed → approves
        ↓
Node updated + Dispatcher notified + Mobile app server notified
        ↓
Dispatcher logs emergency unit dispatch
        ↓
Observer monitors → adds measures or requests more units as needed
        ↓
Observer resolves incident → case closed
```

---

## Key Rules

- **One role per user** — every account has exactly one assigned role
- **One owner per incident** — only one Road Observer manages a given incident at a time
- **No approval delay** — when a Road Observer approves an action, it executes immediately
- **Node protection** — nodes involved in active incidents are locked from maintenance changes
- **Automatic queuing** — if no Observer is immediately available, incidents are queued and assigned in order

---

## What the Central Unit Does Not Handle (Yet)

- Direct integration with government emergency service networks (planned for a future phase)
- Automated dispatching to emergency services (currently logged internally only)
- Live data access for the Data Analyst role (historical records only)
- Node Maintainer remote command details and configuration parameters (to be defined)
