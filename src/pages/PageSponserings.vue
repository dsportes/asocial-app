<template>
  <q-page>
    <info-restriction :niveau="3" cnx/>

    <div v-if="session.compte.estParrain"> <!-- Changement de phrase secrète -->
      <q-btn class="q-mt-sm q-ml-xs" size="md" icon="manage_accounts" no-caps
        :label="$t('SPnouv')" color="warning" dense @click="nouveausp"/>
      <bouton-help class="q-ml-sm" page="page1"/>
    </div>

    <q-separator class="q-my-sm"/>
    <div class="titre-lg q-my-md">avatar.sponsorings.size ? {{$t('NPsexp')}} : {{$t('NPnosp')}}</div>

    <div v-for="sp in avatar.sponsorings" :key="sp.ids">
      <q-separator class="q-mt-md"/>
      <div class="titre-md">{{$t('NPst' + sp.st, [dhcool(np.dh)])}}</div>
      <div class="titre-md">{{$t('NPphr',[sp.psp])}}</div>
      <div class="fs-md">{{$t('NPdlv',[new DateJour(sp.dlv).aaaammjj])}}</div>
      <div class="titre-md">{{$t('NPnom')}}
        <span class="text-bold font-mono q-px-md">{{sp.descr.naf.nom}}</span>
      </div>
      <div class="titre-md">{{$t('NPtribu')}}
        <span class="text-bold font-mono q-px-md">{{sp.descr.nct.nom}}</span>
        <span v-if="sp.descr.sp" class="text-italic q-px-md">{{$t('NPspons')}}</span>
      </div>
      <div v-if="sp.st===1">
        <q-btn class="q-mr-md" color="primary" size="sm" dense :label="$t('NPprol')" @click="prolonger(sp)"/>
        <q-btn color="warning" size="sm" dense :label="$t('NPann')" @click="annuler(sp)"/>
      <div>
    </div>

    <!-- Dialogue de création d'un sponsoring -->
    <q-dialog v-if="nvsp" v-model="nvsp" full-height persistent>
      <nouveau-sponsoring :close="closesp"/>
    </q-dialog>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'

export default {
  name: 'PageSponsorings',

  components: { BoutonHelp, NouveauSponsoring },

  computed: {
  },

  data () {
    return {
      nvsp: false
    }
  },

  methods: {
    async nouveausp () { if (await session.aut(3)) this.nvsp = true },
    closesp () { this.nvsp = false },
    dlved (sp) { return new DateJour(sp.dlv).aaaammjj },
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
    async prolonger (sp) {},
    async annuler (sp) {}
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
