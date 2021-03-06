import 'reflect-metadata'
import { logger } from '@Services/logger.service'
import { environment as env } from '@Utils/environment'
import { importx } from '@discordx/importer'
import chalk from 'chalk'
import { Guild, Intents, Interaction, Message } from 'discord.js'
import { Client, Discord } from 'discordx'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Runner class.
 *
 * @author Karafra
 * @since 1.0
 */
@Discord()
export class Main {
  /**
   * Discord client.
   */
  private static _client: Client

  static get Client(): Client {
    return this._client
  }

  static set Client(value: Client) {
    this._client = value
  }

  /**
   * @name start
   * @description Starts up discord bot
   */
  static async start(): Promise<void> {
    const { environment, token } = env
    Main.Client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
      ],
      botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
      silent: environment === 'production' ? undefined : false
    })
    await importx(`${__dirname}/commands/**/*.{ts,js}`)
    await importx(`${__dirname}/events/**/*.{ts,js}`)
    await Main.Client.login(token ?? '')

    Main.Client.once('ready', async () => {
      logger.info('info check')
      logger.warn('warning check')
      logger.error('error check')
      await Main.Client.guilds.fetch()
      await Main.Client.clearApplicationCommands()
      await Main.Client.initApplicationCommands()

      // Bot Actions
      Main.Client.user?.setActivity(`@${Main.Client.user.username} • /help`, {
        type: 'LISTENING'
      })
      logger.info(chalk.bold('BOT READY'))
    })

    Main.Client.on('interactionCreate', (interaction: Interaction) => {
      Main.Client.executeInteraction(interaction)
    })

    Main.Client.on('messageCreate', (message: Message) => {
      Main.Client.executeCommand(message)
    })

    Main.Client.on('guildCreate', (guild: Guild) => {
      const applicationCommands = Main.Client.applicationCommands as any
      Main.Client.initGuildApplicationCommands(guild.id, applicationCommands)
    })
    process.on('SIGTERM', () => {
      logger.info(chalk.bold('BOT SHUTING DOWN'))
      Main.Client.user?.setStatus('invisible')
      Main.Client.destroy()
      return 0
    })
  }
}

Main.start()
