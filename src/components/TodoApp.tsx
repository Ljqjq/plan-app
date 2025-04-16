import React from 'react';
import { AddEvent } from './AddEvent';
import { EventList } from './EventList';
import EventsDashboard from './EventsDashboard';

const TodoApp = () => {
  return (
    <div>
      <AddEvent />
      <EventsDashboard></EventsDashboard>
    </div>
  );
};

export default TodoApp;