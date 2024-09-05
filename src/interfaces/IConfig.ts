export default interface IConfig {
  createVoice: {
    /**
     * The channel ID where the voice channels will be created from
     */
    channelId: string;
    /**
     * The category ID where the voice channels will be created
     */
    categoryId: string;
    /**
     * The channel IDs that should not be deleted
     */
    noDelete: string[];
  };
  /**
   * The staff role that will be used for moderation commands
   */
  staffRole: string;
  /**
   * The prefix that will be used for commands
   */
  prefix: string;

  welcomer: {
    /**
     * The channel ID where the welcome message will be sent
     */
    channelId: string;

    /**
     * The rules channel ID
     */
    rulesChannel: string;
  };
}
