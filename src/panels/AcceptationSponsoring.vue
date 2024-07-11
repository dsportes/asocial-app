<template>
<q-dialog v-model="ui.d.ASaccsp" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-sm">
      <div :class="'titre-md text-' + clr(sp)">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
      <div class="titre-md">{{$t('NPphr')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{pc.phrase}}</span>
      </div>
      <div class="titre-md">{{$t('NPdlv')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{AMJ.editDeAmj(sp.dlv)}}</span>
      </div>
      <div class="titre-md">{{$t('NPnom')}}
        <span class="text-bold font-mono q-px-md">{{sp.nom}}</span>
      </div>
      <div class="q-mt-md titre-md">{{$t('NPsponsor')}}</div>
      <div class="row items-start">
        <img class="photomax col-auto q-mr-sm" :src="sp.cv.photo" />
        <div class="col column">
          <div>
            <span class="text-bold fs-md q-mr-sm">{{sp.cv.nomc}}</span> 
            <span class="text-bold fs-sm font-mono q-mr-sm">#{{sp.cv.id}}</span> 
          </div>
          <show-html v-if="sp.cv.texte" class="q-my-xs border1" zoom maxh="4rem" :texte="sp.cv.texte"/>
          <div v-else class="text-italic">{{$t('FAnocv')}}</div>
        </div>
      </div>

      <div v-if="sp.estA" class="text-warning titre-md text-bold">
        <span>{{$t('compteA')}}</span>
        <span v-if="sp.don" class="q-ml-sm">{{$t('NPdon', [sp.don])}}</span>
        <span v-if="sp.dconf" class="q-ml-sm">{{$t('conf')}}</span>
      </div>

      <div :class="'titre-md ' + (sp.del ? 'text-warning' : 'text.primary')">
        {{$t(sp.del ? 'compteD' : 'compteO', [sp.partitionId])}}
      </div>

      <div class="titre-md">{{$t('NPquo')}}</div>
      <quotas-vols class="q-ml-md" :vols="sp.quotas" noutil/>

      <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
      <show-html class="q-mb-xs border1" zoom maxh="4rem" :texte="sp.ard"/>

      <q-separator color="orange" class="q-my-md"/>
      <div class="q-gutter-md row justify-center full-width">
        <q-radio dense v-model="accdec" color="primay" class="text-primary"
          :val="1" :label="$t('NPacc')" />
        <q-radio dense v-model="accdec" color="warning" class="text-warning"
          :val="2" :label="$t('NPdec')" />
      </div>
      <q-separator color="orange" class="q-my-md"/>

      <div v-if="accdec===1 && ps">
        <q-checkbox v-if="!sp.dconf" class="titre-md text-bold" size="md" dense 
            left-label v-model="dconf" :label="$t('APAcf2', [sp.cv.nom])" />
        <div class="titre-md q-mt-sm">{{$t('NPmota')}}</div>
        <editeur-md mh="10rem" v-model="texte" :texte="textedef" editable modetxt/>
        <btn-cond flat @ok="fermer" :label="$t('renoncer')" class="q-ml-sm" />
        <btn-cond flat @ok="confirmer" :disable="texte.length === 0"
          color="warning" :label="$t('APAconf')" class="q-ml-sm" />
      </div>

      <div v-if="accdec===2">
        <div class="titre-md q-mt-sm">{{$t('NPmotd')}}</div>
        <editeur-md mh="10rem" v-model="texte" :texte="textedef" editable modetxt/>
        <btn-cond flat @ok="fermer" :label="$t('renoncer')" class="q-ml-sm" />
        <btn-cond flat @ok="refuser" color="warning"
          :disable="texte.length === 0"
          :label="$t('APAdec2')" class="q-ml-sm" />
      </div>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import { deconnexion, SyncSp, RefusSponsoring, ExistePhrase } from '../app/synchro.mjs'
import QuotasVols from '../components/QuotasVols.vue'
import BtnCond from '../components/BtnCond.vue'
import { styp, dhcool, afficherDiag } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

export default ({
  name: 'AcceptationSponsoring',

  props: { sp: Object, pc: Object, org: String },
  /*
  pc : objet Phrase
  sp : objet Sponsoring décodé
  */

  components: { BtnCond, EditeurMd, ShowHtml, BoutonHelp, QuotasVols },

  computed: {
    textedef () { return this.$t('merci', [this.sp.cv.nom]) }
  },

  data () {
    return {
      accdec: 0,
      isPwd: false,
      jourJ: AMJ.amjUtc(),
      max: [1, 1],
      ps: null,
      apsf: false,
      texte: '',
      npi: false,
      dhcool: dhcool,
      dconf: false
    }
  },

  watch: {
    accdec (ap, av) {
      if (ap === 1 && !this.ps) {
        this.ui.ps = {
          labelValider: 'ok',
          verif: true,
          orgext: this.org,
          ok: this.okps,
          initVal: this.ps ? this.ps.phrase : ''
        }
        this.ui.oD('PSouvrir')
      }
    }
  },

  methods: {
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
    fermer () {
      this.texte = ''
      this.apsf = false
      this.isPwd = false
      this.ps = null
      this.ui.fD()
    },
    async okps (ps) {
      if (ps) {
        if (await new ExistePhrase().run(ps.hps1, 1)) {
          await afficherDiag(this.$t('existe'))
          return
        }
        this.ps = ps
      } else {
        this.accdec = 0
      }
    },
    async confirmer () {
      await new SyncSp().run(this.org, this.sp, this.texte, this.ps, this.dconf)
      this.fermer()
    },
    async refuser () {
      await new RefusSponsoring().run(this.sp, this.texte + '\n\n' + this.sp.ard)
      this.fermer()
      deconnexion()
    }
  },

  setup (props) {
    const ui = stores.ui
    const sp = toRef(props, 'sp')
    // const pc = toRef(props, 'pc')
    return {
      ui, ID, styp, AMJ,
      pSt: stores.people
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.border1
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
</style>
