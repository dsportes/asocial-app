<template>
  <q-page>
    <q-card class="largeur40 maauto q-mb-lg q-pa-sm row justify-center items-center" v-if="session.estSponsor || estComptable"> 
      <!-- Nouveau sponsoring -->
      <q-btn class="q-mt-sm q-ml-xs" size="md" icon="manage_accounts" no-caps
        :label="$t('NPnouv')" color="warning" dense @click="nouveausp"/>
      <bouton-help class="q-ml-sm" page="page1"/>
    </q-card>

    <q-card class="largeur40 maauto q-pa-sm titre-lg text-center">{{sponsorings.length ? $t('NPspex') : $t('NPnosp')}}</q-card>

    <q-card class="largeur40 maauto q-mt-lg" v-for="(sp, idx) in sponsorings" :key="sp.ids">
      <div :class="'q-px-sm ' + dkli(idx)">
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
        <show-html class="q-mb-xs bord" zoom maxh="4rem" :texte="sp.ard" :idx="idx"/>

        <div v-if="sp.st===0" class="q-mt-sm row justify-center items-center">
          <div class="titre-md text-italic q-mr-sm">{{$t('NPpro')}}</div>
          <q-btn class="q-mr-xs" color="primary" size="md" dense :label="$t('NPpro7')" @click="prolonger(sp, 7)"/>
          <q-btn class="q-mr-xs" color="primary" size="md" dense :label="$t('NPpro20')" @click="prolonger(sp, 20)"/>
          <q-btn class="q-mr-lg" color="primary" size="md" dense :label="$t('NPpro30')" @click="prolonger(sp, 30)"/>
          <q-btn color="warning" size="md" dense :label="$t('NPann')" @click="prolonger(sp, 0)"/>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un sponsoring -->
    <q-dialog v-model="nvsp" full-height persistent>
      <nouveau-sponsoring :tribu="aSt.tribu"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { AMJ, UNITEV1, UNITEV2, ID } from '../app/api.mjs'
import { dhcool, edvol } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ShowHtml from '../components/ShowHtml.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import { MD } from '../app/modele.mjs'
import { ProlongerSponsoring } from '../app/connexion.mjs'

export default {
  name: 'PageSponsorings',

  components: { BoutonHelp, NouveauSponsoring, ShowHtml },

  computed: {
    sponsorings () { 
      const r = Array.from(this.aSt.getSponsorings(this.avatar.id).values()) || []
      r.sort((a,b) => { return a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)} )
      return r
    },
    estComptable () { return ID.estComptable(this.avatar.id) }
  },

  data () {
    return {
      dhcool: dhcool
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },

    async nouveausp () { if (await this.session.edit()) this.ovnvsp() },
    dlved (sp) { return AMJ.editDeAmj(sp.dlv) },
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
    async prolonger (sp, nj) {
      const ndlv = !nj ? 0 : AMJ.amjUtcPlusNbj(this.session.dateJourConnx, nj)
      new ProlongerSponsoring().run(sp, ndlv)
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const avatar = ref(aSt.avC)

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0] === session.avatarId) {
          avatar.value = aSt.getAvatar(session.avatarId)
        }
      })
    })

    const nvsp = ref(false)
    function ovnvsp () { MD.oD(nvsp) }

    return {
      MD, nvsp, ovnvsp,
      avatar,
      aSt,
      session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
</style>
