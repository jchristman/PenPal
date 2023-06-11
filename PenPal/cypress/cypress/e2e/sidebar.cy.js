import Sidebar from "../pages/Sidebar";

const sidebar = new Sidebar();

describe('Sidebar', () => {
  beforeEach(() => {
    cy.visit("/");
  });
  
  
  it('Should navigate to all sidebar endpoints', () => {
    sidebar.navButton('projects').click();   
    cy.url().should('include', '/projects') 
    sidebar.navButton('dashboard').click();
    cy.url().should('eq', "http://localhost:3000/");
    sidebar.navButton('configuration').click();
    cy.url().should('include', "/configure");
  })

  // If this test fails, write another assertion for the added/removed nav button
  it('Should have the expected number of sidebar buttons', () => {
    sidebar.navButtons().should('have.length', 3);
  });
})