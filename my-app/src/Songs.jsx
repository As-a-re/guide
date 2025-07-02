import React from 'react';
import Hymns from './components/Hymns';

// Styles
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#14213d',
    padding: '1rem',
    overflow: 'hidden', // Prevent page scroll
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    padding: '0.5rem',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: "#44a248",
    marginTop: '1vh',
  },
  hymnsContainer: {
    flex: 1,
    overflow: 'hidden', // Hide scrollbar
    borderRadius: '0.5rem',
    backgroundColor: '#22314f',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  // Hide scrollbar for different browsers
  hideScrollbar: {
    msOverflowStyle: 'none',  /* IE and Edge */
    scrollbarWidth: 'none',  /* Firefox */
    '&::-webkit-scrollbar': {
      display: 'none', /* Chrome, Safari, Opera */
    },
  },
};

const SongsPage = () => {
  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>Church Hymns</h1>
      </header>
      <div style={{...styles.hymnsContainer, ...styles.hideScrollbar}}>
        <Hymns />
      </div>
    </div>
  );
};

export default SongsPage;
