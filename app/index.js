require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let locations = {};

// 🔄 locations.json を読み込む関数
function loadLocations() {
  try {
    const data = readFileSync('./locations.json', 'utf8');
    locations = JSON.parse(data);
    console.log('✅ locations.json を読み込みました');
  } catch (error) {
    console.error('❌ locations.json の読み込み失敗:', error);
    locations = {};
  }
}

// 💾 locations.json に保存する関数
function saveLocations() {
  try {
    writeFileSync('./locations.json', JSON.stringify(locations, null, 2), 'utf8');
    console.log('✅ locations.json に保存しました');
  } catch (error) {
    console.error('❌ locations.json の保存失敗:', error);
  }
}

// ✅ 起動時に地点データ読み込み
loadLocations();

// 🔌 Botログイン時の処理
client.once(Events.ClientReady, () => {
  console.log(`✅ Botがログインしました: ${client.user.tag}`);
});

// 🎮 コマンドの処理
client.on(Events.InteractionCreate, async interaction => {
  // 🔎 オートコンプリート対応
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === '座標検索' || interaction.commandName === '座標削除') {
      loadLocations();
      const focused = interaction.options.getFocused();
      const choices = Object.keys(locations);
      const filtered = choices.filter(choice => choice.includes(focused));
      await interaction.respond(
        filtered.map(choice => ({ name: choice, value: choice }))
      );
    }
    return;
  }

  // 💬 スラッシュコマンド処理
  if (interaction.isChatInputCommand()) {
    // 🔍 /座標検索
    if (interaction.commandName === '座標検索') {
      loadLocations();

      const place = interaction.options.getString('場所');
      if (!place) {
        await interaction.reply('⚠️ 場所を指定してください。');
        return;
      }

      if (locations[place]) {
        await interaction.reply(`📍 **${place}** の座標: ${locations[place]}`);
      } else {
        await interaction.reply('⚠️ その場所の情報は登録されていません。');
      }
    }

    // ➕ /座標追加
    else if (interaction.commandName === '座標追加') {
      const place = interaction.options.getString('場所');
      const x = interaction.options.getInteger('x');
      const y = interaction.options.getInteger('y');
      const z = interaction.options.getInteger('z');

      if (!place || x === null || y === null || z === null) {
        await interaction.reply('⚠️ すべてのオプションを正しく指定してください。');
        return;
      }

      loadLocations();
      const coords = `x=${x}, y=${y}, z=${z}`;
      locations[place] = coords;
      saveLocations();

      await interaction.reply(`✅ **${place}** を **${coords}** で登録しました！`);
    }

    // 📄 /座標一覧
    else if (interaction.commandName === '座標一覧') {
      loadLocations();

      const entries = Object.entries(locations);
      if (entries.length === 0) {
        await interaction.reply('📭 登録されている座標はありません。');
        return;
      }

      const listText = entries
        .map(([place, coord]) => `📍 **${place}** → ${coord}`)
        .join('\n');

      await interaction.reply({
        content: `🗺️ 登録済みの座標一覧:\n\n${listText}`,
        ephemeral: false
      });
    }
    // 🔥 /座標削除
    else if (interaction.commandName === '座標削除') {
      const place = interaction.options.getString('場所');

      if (!place) {
        await interaction.reply({ content: '⚠️ 削除する場所を指定してください。', ephemeral: true });
        return;
      }

      loadLocations();
      if (locations[place]) {
        // 確認ボタンの作成
        const confirmButton = new ButtonBuilder()
          .setCustomId('confirm_delete')
          .setLabel('はい、削除する')
          .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
          .setCustomId('cancel_delete')
          .setLabel('いいえ')
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(cancelButton, confirmButton);

        const response = await interaction.reply({
          content: `本当に **${place}** の情報を削除しますか？`,
          components: [row],
          ephemeral: true, // 確認メッセージは本人にだけ見えるようにする
        });

        // コマンド実行者からのインタラクションのみを待つフィルター
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
          // ボタンのインタラクションを60秒待つ
          const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

          if (confirmation.customId === 'confirm_delete') {
            delete locations[place];
            saveLocations();
            await confirmation.update({ content: `🗑️ **${place}** の情報を削除しました。`, components: [] });
          } else if (confirmation.customId === 'cancel_delete') {
            await confirmation.update({ content: '🗑️ 削除をキャンセルしました。', components: [] });
          }
        } catch (e) {
          // タイムアウトした場合
          await interaction.editReply({ content: '⌛ 確認がタイムアウトしたため、削除をキャンセルしました。', components: [] });
        }
      } else {
        await interaction.reply({ content: `⚠️ **${place}** は登録されていません。`, ephemeral: true });
      }
    }
  }
});

// 🚀 Botを起動
client.login(process.env.BOT_TOKEN);
