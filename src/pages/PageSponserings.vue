<template>
  <q-page>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'PageSponsorings',

  computed: {
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const avStore = stores.avatar
    const avatar = ref(session.avC)
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0] === session.avatarId) {
          avatar.value = avStore.getAvatar(session.avatarId)
        }
      })
    })
    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatarCourant') {
          avatar.value = avStore.getAvatar(session.avatarId)
        }
      })
    })

    return {
      avatar,
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
