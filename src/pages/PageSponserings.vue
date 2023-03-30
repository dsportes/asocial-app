<template>
  <q-page>

    <div v-if="session.estSponsor || estComptable"> <!-- Nouveau sponsoring -->
      <q-btn class="q-mt-sm q-ml-xs" size="md" icon="manage_accounts" no-caps
        :label="$t('NPnouv')" color="warning" dense @click="nouveausp"/>
      <bouton-help class="q-ml-sm" page="page1"/>
    </div>

    <div class="titre-lg q-px-sm q-my-md">{{sponsorings.length ? $t('NPspex') : $t('NPnosp')}}</div>

    <div v-for="sp in sponsorings" :key="sp.ids" class="q-pa-sm q-mb-md">
      <q-separator class="q-mt-md"/>
      <div :class="'titre-md text-' + clr(sp)">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
      <div class="titre-md">{{$t('NPphr')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{sp.psp}}</span>
      </div>
      <div class="titre-md">{{$t('NPdlv')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{dlved(sp)}}</span>
      </div>
      <div class="titre-md">{{$t('NPnom')}}
        <span class="text-bold font-mono q-px-md">{{sp.descr.naf.nom}}</span>
      </div>
      <div class="titre-md">{{$t('NPtribu')}}
        <span class="text-bold font-mono q-px-md">{{sp.descr.nct.nom}}</span>
        <span v-if="sp.descr.sp" class="text-italic q-px-md">{{$t('NPspons')}}</span>
      </div>
      <div class="titre-md">{{$t('NPquo')}} :
        <span class="font-mono q-pl-md">v1: {{ed1(sp.descr.quotas[0])}}</span>
        <span class="font-mono q-pl-lg">v2: {{ed2(sp.descr.quotas[1])}}</span>
      </div>
      <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
      <show-html class="q-mb-xs bord" zoom maxh="4rem" :texte="sp.ard"/>

      <div v-if="sp.st===0">
        <q-btn class="q-mr-md" color="primary" size="sm" dense :label="$t('NPprol')" @click="prolonger(sp)"/>
        <q-btn color="warning" size="sm" dense :label="$t('NPann')" @click="annuler(sp)"/>
      </div>
    </div>

    <!-- Dialogue de création d'un sponsoring -->
    <q-dialog v-if="nvsp" v-model="nvsp" full-height persistent>
      <nouveau-sponsoring :close="closesp" :tribu="avStore.tribu"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { AMJ, UNITEV1, UNITEV2, IDCOMPTABLE } from '../app/api.mjs'
import { dhcool, edvol } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ShowHtml from '../components/ShowHtml.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'

export default {
  name: 'PageSponsorings',

  components: { BoutonHelp, NouveauSponsoring, ShowHtml },

  computed: {
    sponsorings () { 
      const r = Array.from(this.avStore.getSponsorings(this.avatar.id).values()) || []
      r.sort((a,b) => { return a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)} )
      return r
    },
    estComptable () { return this.avatar.id === IDCOMPTABLE }
  },

  data () {
    return {
      nvsp: false,
      dhcool: dhcool
    }
  },

  methods: {
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },

    async nouveausp () { if (await this.session.aut(3)) this.nvsp = true },
    closesp () { this.nvsp = false },
    dlved (sp) { return AMJ.editDeAmj(sp.dlv) },
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
    async prolonger (sp) {},
    async annuler (sp) {}
  },

  setup () {
    const session = stores.session
    const avStore = stores.avatar
    const avatar = ref(avStore.avC)
    // TODO
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0] === session.avatarId) {
          avatar.value = avStore.getAvatar(session.avatarId)
        }
      })
    })

    return {
      avatar,
      avStore,
      session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
</style>
