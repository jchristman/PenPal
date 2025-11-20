import buildWebappUsersLoader from "./webapp.dataloaders";

interface DataLoaders {
  webappUsersLoader: ReturnType<typeof buildWebappUsersLoader>;
}

export default (): DataLoaders => ({
  webappUsersLoader: buildWebappUsersLoader()
});
