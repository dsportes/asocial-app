<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <info-restriction :niveau="3" cnx/>

    <div v-if="!chats.length" class="titre-lg text-italic">{{$t('CHnch')}}</div>

    <div v-else v-for="(chat, idx) in chats" :key="chat.ids">
      <apercu-chat :id="chat.id" :ids="chat.ids" :idx="idx" :mapmc="mapmc"/>
      <q-separator class="q-my-sm"/>
    </div>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuChat from '../components/ApercuChat.vue'
import { Motscles } from '../app/modele.mjs'
import InfoRestriction from '../components/InfoRestriction.vue'

export default {
  name: 'PageChats',

  components: { ApercuChat, InfoRestriction },

  computed: {
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const avStore = stores.avatar
    const session = stores.session

    function getChats () { // Array de chats (Map des chats (clé ids) de l'avatar id)
      return Array.from(avStore.getChats(session.avatarId).values())
    }

    const chats = ref(getChats()) // Map des chats (clé ids) de l'avatar id

    const mapmc = ref(Motscles.mapMC(true, 0))

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setChat' && args[0].id === session.avatarId) {
          chats.value = getChats()
        }
      })
    })
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'delChat' && args[0] === session.avatarId) {
          chats.value = getChats()
        }
      })
    })
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setMotscles') {
          mapmc.value = Motscles.mapMC(true, 0)
        }
      })
    })

    /*
    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatarCourant') {
          avatar.value = avStore.getAvatar(session.avatarId)
        }
      })
    })
    */

    return {
      ui: stores.ui,
      session,
      chats,
      mapmc
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
