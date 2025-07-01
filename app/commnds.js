const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('座標検索')
    .setDescription('登録されている座標を検索します')
    .addStringOption(option =>
      option.setName('場所')
        .setDescription('調べたい場所の名前')
        .setRequired(true)
        .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('座標追加')
    .setDescription('新しい場所の座標を追加します')
    .addStringOption(option =>
      option.setName('場所')
        .setDescription('追加したい場所の名前')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('x')
        .setDescription('X座標')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('y')
        .setDescription('Y座標')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('z')
        .setDescription('Z座標')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('座標一覧')
    .setDescription('すべての登録済み座標を一覧で表示します'),

  new SlashCommandBuilder()
    .setName('座標削除')
    .setDescription('登録されている座標を削除します')
    .addStringOption(option =>
      option.setName('場所')
        .setDescription('削除したい場所の名前')
        .setRequired(true)
        .setAutocomplete(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('📤 コマンドを登録中...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ コマンド登録完了！');
  } catch (error) {
    console.error('❌ コマンド登録エラー:', error);
  }
})();
