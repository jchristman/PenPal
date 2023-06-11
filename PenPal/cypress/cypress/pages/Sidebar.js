export default class Sidebar {

    /**
     * Returns the navigation buttons
     */
    navButton(buttonType) {
        return cy.get(`[data-cy="sidebar-nav-${buttonType}-button"]`)
    }

    /**
     * Returns all of the navigation buttons
     */
    navButtons() {
        return cy.get('[data-cy^=sidebar-nav-]');
    }
}