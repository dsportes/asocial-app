<template>
  <q-page>
    <q-card class="largeur40 maauto q-mb-lg q-pa-sm row justify-center items-center" v-if="aSt.estSponsor || estComptable"> 
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

        <div v-if="estA(sp)" class="text-warning titre-md">{{$t('compteA')}}</div>
        <div v-else class="titre-md">{{$t('compteO')}}</div>

        <div v-if="sp.descr.sp" class="titre-md text-warning">
          {{$t('NPspons' + (estA(sp) ? 'A' : ''), [ID.court(idtr(sp))])}}
        </div>

        <div class="titre-md">{{$t('NPquo')}}</div>
        <quotasVols2 class="q-ml-md" :vols="quotas(sp)" noutil/>
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
import { dhcool, edvol, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ShowHtml from '../components/ShowHtml.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import QuotasVols2 from '../components/QuotasVols2.vue'
import { MD, Tribu } from '../app/modele.mjs'
import { ProlongerSponsoring } from '../app/connexion.mjs'

export default {
  name: 'PageSponsorings',

  components: { BoutonHelp, NouveauSponsoring, ShowHtml, QuotasVols2 },

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
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },
    idtr (sp) { return Tribu.id(sp.descr.clet) },
    estA (sp) { return !sp.descr.clet },
    quotas (sp) { const q = sp.descr.quotas; return { qc: q[0], q1: q[1], q2: q[2]}},
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
      ID, MD, nvsp, ovnvsp, dkli,
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
