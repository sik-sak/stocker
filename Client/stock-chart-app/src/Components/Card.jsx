import React from 'react';

const Card = ({title, value}) => {
  return (
    <div className="card" style={{ width: '13rem', margin:'10px auto' }}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <h6 className="card-subtitle mb-2 text-body-secondary">{value}</h6>
      </div>
    </div>
  );
};

export default Card;
