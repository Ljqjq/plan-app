import React from 'react';
import { AddEvent } from './AddEvent';
import { EventList } from './EventList';

const TodoApp = () => {
  return (
    <div>
      <AddEvent />
      <EventList />
    </div>
  );
};

export default TodoApp;